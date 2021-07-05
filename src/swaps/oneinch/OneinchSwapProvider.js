import axios from 'axios'
import BN from 'bignumber.js'
import { SwapProvider } from '../SwapProvider'
import { chains, assets, currencyToUnit } from '@liquality/cryptoassets'
import { sha256 } from '@liquality/crypto'
import pkg from '../../../package.json'
import { withLock, withInterval } from '../../store/actions/performNextAction/utils'
import { timestamp, wait } from '../../store/utils'
import { prettyBalance } from '../../utils/coinFormatter'
import { isEthereumChain, isERC20 } from '@/utils/asset'
import cryptoassets from '@/utils/cryptoassets'

export const VERSION_STRING = `Wallet ${pkg.version} (CAL ${pkg.dependencies['@liquality/client'].replace('^', '').replace('~', '')})`

class OneinchSwapProvider extends SwapProvider {
  constructor ({ providerId, agent }) {
    super(providerId)
    this.agent = agent
  }

  async getSupportedPairs () {
    return []
  }

  async getQuote ({ from, to, amount }) {
    console.log('I am here')
    console.log(from, to, amount)
    // Uniswap only provides liquidity for ethereum tokens
    if (!isEthereumChain(from) || !isEthereumChain(to)) return null
    // Only uniswap on ethereum is supported atm
    if (cryptoassets[from].chain !== 'ethereum' || cryptoassets[to].chain !== 'ethereum') return null
    console.log('in 1inch after pass checks')
    console.log('before quote data')
    const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    const fromAmountInUnit = BN(currencyToUnit(cryptoassets[from], BN(amount)))
    const trade = await axios({
      url: this.agent + '/quote',
      method: 'get',
      params: { fromTokenAddress: assets[from].contractAddress || ethAddress, toTokenAddress: assets[to].contractAddress || ethAddress, amount: fromAmountInUnit.toNumber() },
      headers: {
        'x-requested-with': VERSION_STRING,
        'x-liquality-user-agent': VERSION_STRING
      }
    })
    console.log(trade.data)
    const toAmountInUnit = BN(trade.data.toTokenAmount) // unitToCurrency(cryptoassets[to], BN(trade.data.toTokenAmount))
    console.log('returned object')
    console.log({
      from,
      to,
      // TODO: Amounts should be in BigNumber to prevent loss of precision
      fromAmount: fromAmountInUnit.toNumber(),
      toAmount: toAmountInUnit.toNumber()
    })
    return {
      from,
      to,
      // TODO: Amounts should be in BigNumber to prevent loss of precision
      fromAmount: fromAmountInUnit.toNumber(),
      toAmount: toAmountInUnit.toNumber()
    }
  }

  async newSwap ({ network, walletId, quote: _quote }) {
    const lockedQuote = await this._getQuote({ from: _quote.from, to: _quote.to, amount: _quote.fromAmount })

    if (BN(lockedQuote.toAmount).lt(BN(_quote.toAmount).times(0.995))) {
      throw new Error('The quote slippage is too high (> 0.5%). Try again.')
    }

    const quote = {
      ..._quote,
      ...lockedQuote
    }

    if (await this.hasQuoteExpired({ network, walletId, swap: quote })) {
      throw new Error('The quote is expired.')
    }

    quote.fromAddress = await this.getSwapAddress(network, walletId, quote.from, quote.fromAccountId)
    quote.toAddress = await this.getSwapAddress(network, walletId, quote.to, quote.toAccountId)

    const account = this.getAccount(quote.fromAccountId)
    const fromClient = this.getClient(network, walletId, quote.from, account?.type)

    const message = [
      'Creating a swap with following terms:',
      `Send: ${quote.fromAmount} (lowest denomination) ${quote.from}`,
      `Receive: ${quote.toAmount} (lowest denomination) ${quote.to}`,
      `My ${quote.from} Address: ${quote.fromAddress}`,
      `My ${quote.to} Address: ${quote.toAddress}`,
      `Counterparty ${quote.from} Address: ${quote.fromCounterPartyAddress}`,
      `Counterparty ${quote.to} Address: ${quote.toCounterPartyAddress}`,
      `Timestamp: ${quote.swapExpiration}`
    ].join('\n')

    const messageHex = Buffer.from(message, 'utf8').toString('hex')
    const secret = await fromClient.swap.generateSecret(messageHex)
    const secretHash = sha256(secret)

    const fromFundTx = await fromClient.swap.initiateSwap(
      {
        value: BN(quote.fromAmount),
        recipientAddress: quote.fromCounterPartyAddress,
        refundAddress: quote.fromAddress,
        secretHash: secretHash,
        expiration: quote.swapExpiration
      },
      quote.fee
    )

    return {
      ...quote,
      status: 'INITIATED',
      secret,
      secretHash,
      fromFundHash: fromFundTx.hash,
      fromFundTx
    }
  }

  updateOrder (order) {
    return axios({
      url: this.agent + '/api/swap/order/' + order.id,
      method: 'post',
      data: {
        fromAddress: order.fromAddress,
        toAddress: order.toAddress,
        fromFundHash: order.fromFundHash,
        secretHash: order.secretHash
      },
      headers: {
        'x-requested-with': VERSION_STRING,
        'x-liquality-user-agent': VERSION_STRING
      }
    }).then(res => res.data)
  }

  async hasQuoteExpired ({ swap }) {
    return timestamp() >= swap.expiresAt
  }

  async hasChainTimePassed ({ network, walletId, asset, timestamp }) {
    const client = this.getClient(network, walletId, asset)
    const maxTries = 3
    let tries = 0
    while (tries < maxTries) {
      try {
        const blockNumber = await client.chain.getBlockHeight()
        const latestBlock = await client.chain.getBlockByNumber(blockNumber)
        return latestBlock.timestamp > timestamp
      } catch (e) {
        tries++
        if (tries >= maxTries) throw e
        else {
          console.warn(e)
          await wait(2000)
        }
      }
    }
  }

  async canRefund ({ network, walletId, swap }) {
    return this.hasChainTimePassed({ network, walletId, asset: swap.from, timestamp: swap.swapExpiration, fromAccountId: swap.fromAccountId })
  }

  async hasSwapExpired ({ network, walletId, swap }) {
    return this.hasChainTimePassed({ network, walletId, asset: swap.to, timestamp: swap.nodeSwapExpiration, fromAccountId: swap.fromAccountId })
  }

  async handleExpirations ({ network, walletId, swap }) {
    if (await this.canRefund({ swap, network, walletId })) {
      return { status: 'GET_REFUND' }
    }
    if (await this.hasSwapExpired({ swap, network, walletId })) {
      return { status: 'WAITING_FOR_REFUND' }
    }
  }

  async fundSwap ({ swap, network, walletId }) {
    if (await this.hasQuoteExpired({ network, walletId, swap })) {
      return { status: 'QUOTE_EXPIRED' }
    }

    if (!isERC20(swap.from)) return { status: 'FUNDED' } // Skip. Only ERC20 swaps need funding

    const account = this.getAccount(swap.fromAccountId)
    const fromClient = this.getClient(network, walletId, swap.from, account?.type)

    await this.sendLedgerNotification(account, 'Signing required to fund the swap.')

    const fundTx = await fromClient.swap.fundSwap(
      {
        value: BN(swap.fromAmount),
        recipientAddress: swap.fromCounterPartyAddress,
        refundAddress: swap.fromAddress,
        secretHash: swap.secretHash,
        expiration: swap.swapExpiration
      },
      swap.fromFundHash,
      swap.fee
    )

    return {
      fundTxHash: fundTx.hash,
      status: 'FUNDED'
    }
  }

  async reportInitiation ({ swap, network, walletId }) {
    if (await this.hasQuoteExpired({ network, walletId, swap })) {
      return { status: 'WAITING_FOR_REFUND' }
    }

    await this.updateOrder(swap)

    return {
      status: 'INITIATION_REPORTED'
    }
  }

  async confirmInitiation ({ swap, network, walletId }) {
    // Jump the step if counter party has already accepted the initiation
    const counterPartyInitiation = await this.findCounterPartyInitiation({ swap, network, walletId })
    if (counterPartyInitiation) return counterPartyInitiation
    const account = this.getAccount(swap.fromAccountId)

    const fromClient = this.getClient(network, walletId, swap.from, account?.type)

    try {
      const tx = await fromClient.chain.getTransactionByHash(swap.fromFundHash)

      if (tx && tx.confirmations > 0) {
        return {
          status: 'INITIATION_CONFIRMED'
        }
      }
    } catch (e) {
      if (e.name === 'TxNotFoundError') console.warn(e)
      else throw e
    }
  }

  async findCounterPartyInitiation ({ swap, network, walletId }) {
    const account = this.getAccount(swap.toAccountId)
    const toClient = this.getClient(network, walletId, swap.to, account?.type)

    try {
      const tx = await toClient.swap.findInitiateSwapTransaction(
        {
          value: BN(swap.toAmount),
          recipientAddress: swap.toAddress,
          refundAddress: swap.toCounterPartyAddress,
          secretHash: swap.secretHash,
          expiration: swap.nodeSwapExpiration
        }
      )

      if (tx) {
        const toFundHash = tx.hash
        const isVerified = await toClient.swap.verifyInitiateSwapTransaction(
          {
            value: BN(swap.toAmount),
            recipientAddress: swap.toAddress,
            refundAddress: swap.toCounterPartyAddress,
            secretHash: swap.secretHash,
            expiration: swap.nodeSwapExpiration
          },
          toFundHash
        )

        // ERC20 swaps have separate funding tx. Ensures funding tx has enough confirmations
        const fundingTransaction = await toClient.swap.findFundSwapTransaction(
          {
            value: BN(swap.toAmount),
            recipientAddress: swap.toAddress,
            refundAddress: swap.toCounterPartyAddress,
            secretHash: swap.secretHash,
            expiration: swap.nodeSwapExpiration
          },
          toFundHash
        )
        const fundingConfirmed = fundingTransaction
          ? fundingTransaction.confirmations >= chains[cryptoassets[swap.to].chain].safeConfirmations
          : true

        if (isVerified && fundingConfirmed) {
          return {
            toFundHash,
            status: 'CONFIRM_COUNTER_PARTY_INITIATION'
          }
        }
      }
    } catch (e) {
      if (['BlockNotFoundError', 'PendingTxError', 'TxNotFoundError'].includes(e.name)) console.warn(e)
      else throw e
    }

    // Expiration check should only happen if tx not found
    const expirationUpdates = await this.handleExpirations({ swap, network, walletId })
    if (expirationUpdates) { return expirationUpdates }
  }

  async confirmCounterPartyInitiation ({ swap, network, walletId }) {
    const account = this.getAccount(swap.toAccountId)
    const toClient = this.getClient(network, walletId, swap.to, account?.type)

    const tx = await toClient.chain.getTransactionByHash(swap.toFundHash)

    if (tx && tx.confirmations >= chains[cryptoassets[swap.to].chain].safeConfirmations) {
      return {
        status: 'READY_TO_CLAIM'
      }
    }

    // Expiration check should only happen if tx not found
    const expirationUpdates = await this.handleExpirations({ swap, network, walletId })
    if (expirationUpdates) { return expirationUpdates }
  }

  async claimSwap ({ swap, network, walletId }) {
    const expirationUpdates = await this.handleExpirations({ swap, network, walletId })
    if (expirationUpdates) { return expirationUpdates }

    const account = this.getAccount(swap.toAccountId)
    const toClient = this.getClient(network, walletId, swap.to, account?.type)

    await this.sendLedgerNotification(swap, account, 'Signing required to claim the swap.')

    const toClaimTx = await toClient.swap.claimSwap(
      {
        value: BN(swap.toAmount),
        recipientAddress: swap.toAddress,
        refundAddress: swap.toCounterPartyAddress,
        secretHash: swap.secretHash,
        expiration: swap.nodeSwapExpiration
      },
      swap.toFundHash,
      swap.secret,
      swap.claimFee
    )

    return {
      toClaimHash: toClaimTx.hash,
      toClaimTx,
      status: 'WAITING_FOR_CLAIM_CONFIRMATIONS'
    }
  }

  async waitForClaimConfirmations ({ swap, network, walletId }) {
    const account = this.getAccount(swap.toAccountId)
    const toClient = this.getClient(network, walletId, swap.to, account?.type)

    try {
      const tx = await toClient.chain.getTransactionByHash(swap.toClaimHash)

      if (tx && tx.confirmations > 0) {
        this.updateBalances({ network, walletId, assets: [swap.to, swap.from] })

        return {
          endTime: Date.now(),
          status: 'SUCCESS'
        }
      }
    } catch (e) {
      if (e.name === 'TxNotFoundError') console.warn(e)
      else throw e
    }

    // Expiration check should only happen if tx not found
    const expirationUpdates = await this.handleExpirations({ swap, network, walletId })
    if (expirationUpdates) { return expirationUpdates }
  }

  async waitForRefund ({ swap, network, walletId }) {
    if (await this.canRefund({ swap, network, walletId })) {
      return { status: 'GET_REFUND' }
    }
  }

  async waitForRefundConfirmations ({ swap, network, walletId }) {
    const account = this.getAccount(swap.fromAccountId)
    const fromClient = this.getClient(network, walletId, swap.from, account?.type)
    try {
      const tx = await fromClient.chain.getTransactionByHash(swap.refundHash)

      if (tx && tx.confirmations > 0) {
        return {
          endTime: Date.now(),
          status: 'REFUNDED'
        }
      }
    } catch (e) {
      if (e.name === 'TxNotFoundError') console.warn(e)
      else throw e
    }
  }

  async refundSwap ({ swap, network, walletId }) {
    const account = this.getAccount(swap.fromAccountId)
    const fromClient = this.getClient(network, walletId, swap.from, account?.type)
    await this.sendLedgerNotification(swap, account, 'Signing required to refund the swap.')
    const refundTx = await fromClient.swap.refundSwap(
      {
        value: BN(swap.fromAmount),
        recipientAddress: swap.fromCounterPartyAddress,
        refundAddress: swap.fromAddress,
        secretHash: swap.secretHash,
        expiration: swap.swapExpiration
      },
      swap.fromFundHash,
      swap.fee
    )

    return {
      refundHash: refundTx.hash,
      refundTx,
      status: 'WAITING_FOR_REFUND_CONFIRMATIONS'
    }
  }

  async performNextSwapAction (store, { network, walletId, swap }) {
    let updates
    switch (swap.status) {
      case 'INITIATED':
        updates = await this.reportInitiation({ swap, network, walletId })
        break

      case 'INITIATION_REPORTED':
        updates = await withInterval(async () => this.confirmInitiation({ swap, network, walletId }))
        break

      case 'INITIATION_CONFIRMED':
        updates = await withLock(store, { item: swap, network, walletId, asset: swap.from },
          async () => this.fundSwap({ swap, network, walletId }))
        break

      case 'FUNDED':
        updates = await withInterval(async () => this.findCounterPartyInitiation({ swap, network, walletId }))
        break

      case 'CONFIRM_COUNTER_PARTY_INITIATION':
        updates = await withInterval(async () => this.confirmCounterPartyInitiation({ swap, network, walletId }))
        break

      case 'READY_TO_CLAIM':
        updates = await withLock(store, { item: swap, network, walletId, asset: swap.to },
          async () => this.claimSwap({ swap, network, walletId }))
        break

      case 'WAITING_FOR_CLAIM_CONFIRMATIONS':
        updates = await withInterval(async () => this.waitForClaimConfirmations({ swap, network, walletId }))
        break

      case 'WAITING_FOR_REFUND':
        updates = await withInterval(async () => this.waitForRefund({ swap, network, walletId }))
        break

      case 'GET_REFUND':
        updates = await withLock(store, { item: swap, network, walletId, asset: swap.from },
          async () => this.refundSwap({ swap, network, walletId }))
        break

      case 'WAITING_FOR_REFUND_CONFIRMATIONS':
        updates = await withInterval(async () => this.waitForRefundConfirmations({ swap, network, walletId }))
        break
    }

    return updates
  }

  static txTypes = {
    SWAP: 'SWAP'
  }

  static feeUnits = {
    SWAP_INITIATION: {
      BTC: 370, // Assume 2 inputs
      ETH: 165000,
      RBTC: 165000,
      BNB: 165000,
      NEAR: 10000000000000,
      MATIC: 165000,
      ERC20: 600000 + 94500 // Contract creation + erc20 transfer
    },
    SWAP_CLAIM: {
      BTC: 143,
      ETH: 45000,
      RBTC: 45000,
      BNB: 45000,
      MATIC: 45000,
      NEAR: 8000000000000,
      ERC20: 100000
    }
  }

  static statuses = {
    INITIATED: {
      step: 0,
      label: 'Locking {from}',
      filterStatus: 'PENDING'
    },
    INITIATION_REPORTED: {
      step: 0,
      label: 'Locking {from}',
      filterStatus: 'PENDING',
      notification () {
        return {
          message: 'Swap initiated'
        }
      }
    },
    INITIATION_CONFIRMED: {
      step: 0,
      label: 'Locking {from}',
      filterStatus: 'PENDING'
    },
    FUNDED: {
      step: 1,
      label: 'Locking {to}',
      filterStatus: 'PENDING'
    },
    CONFIRM_COUNTER_PARTY_INITIATION: {
      step: 1,
      label: 'Locking {to}',
      filterStatus: 'PENDING',
      notification (swap) {
        return {
          message: `Counterparty sent ${prettyBalance(swap.toAmount, swap.to)} ${swap.to} to escrow`
        }
      }
    },
    READY_TO_CLAIM: {
      step: 2,
      label: 'Claiming {to}',
      filterStatus: 'PENDING',
      notification () {
        return {
          message: 'Claiming funds'
        }
      }
    },
    WAITING_FOR_CLAIM_CONFIRMATIONS: {
      step: 2,
      label: 'Claiming {to}',
      filterStatus: 'PENDING'
    },
    WAITING_FOR_REFUND: {
      step: 2,
      label: 'Pending Refund',
      filterStatus: 'PENDING'
    },
    GET_REFUND: {
      step: 2,
      label: 'Refunding {from}',
      filterStatus: 'PENDING'
    },
    WAITING_FOR_REFUND_CONFIRMATIONS: {
      step: 2,
      label: 'Refunding {from}',
      filterStatus: 'PENDING'
    },
    REFUNDED: {
      step: 3,
      label: 'Refunded',
      filterStatus: 'REFUNDED',
      notification (swap) {
        return {
          message: `Swap refunded, ${prettyBalance(swap.fromAmount, swap.from)} ${swap.from} returned`
        }
      }
    },
    SUCCESS: {
      step: 3,
      label: 'Completed',
      filterStatus: 'COMPLETED',
      notification (swap) {
        return {
          message: `Swap completed, ${prettyBalance(swap.toAmount, swap.to)} ${swap.to} ready to use`
        }
      }
    },
    QUOTE_EXPIRED: {
      step: 3,
      label: 'Quote Expired',
      filterStatus: 'REFUNDED'
    }
  }

  static fromTxType = OneinchSwapProvider.txTypes.SWAP
  static toTxType = null

  static totalSteps = 4
}

export { OneinchSwapProvider }
