import { ethers } from 'ethers'
import { JsonRpcProvider } from '@liquality/jsonrpc-provider'
import {
  numberToHex,
  hexToNumber,
  ensure0x,
  normalizeTransactionObject,
  remove0x,
  buildTransaction
} from '@liquality/ethereum-utils'
import { Address, Block, ethereum, SendOptions, Transaction, ChainProvider, BigNumber } from '@liquality/types'
import { sleep, addressToString } from '@liquality/utils'
import { InvalidDestinationAddressError, TxNotFoundError, BlockNotFoundError } from '@liquality/errors'
import { padHexStart } from '@liquality/crypto'

const GAS_LIMIT_MULTIPLIER = 1.5

const proxyABI = [
  'event ExecutionFailure(bytes32 txHash, uint256 payment)',
  'event ExecutionSuccess(bytes32 txHash, uint256 payment)',
  'function payETH(address to, uint256 amount)',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
  'function requiredTxGas(address to, uint256 value, bytes calldata data, uint8 operation) external returns (uint256)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes memory)',
]

const rushWalletInterface = new ethers.utils.Interface(proxyABI)

export class RushRpcProvider extends JsonRpcProvider {

  constructor(options) {
    super(options.uri, options.username, options.password)
    this._usedAddressCache = {}
    this._proxyAddress = options.proxyAddress
  }

  async rpc(method, ...params) {
    const result = await this.jsonrpc(method, ...params)
    return result
  }

  async getAddresses() {
    const addresses = await this.rpc('eth_accounts')
    return addresses.map((address) => new Address({ address: remove0x(address) }))
  }

  async getUnusedAddress() {
    const addresses = await this.getAddresses()
    return addresses[0]
  }

  async getUsedAddresses() {
    const addresses = await this.getAddresses()
    return [addresses[0]]
  }

  async isWalletAvailable() {
    const addresses = await this.rpc('eth_accounts')
    return addresses.length > 0
  }

  async sendTransaction(options){
    const addresses = await this.getAddresses()
    const from = addresses[0].address

    const txOptions = {
      from,
      to: options.to ? addressToString(options.to) : (options.to),
      value: options.value,
      data: options.data
    }
    if (options.fee) txOptions.gasPrice = new BigNumber(options.fee)

    const txData = buildTransaction(txOptions)
    const gas = await this.estimateGas(txData)
    txData.gas = numberToHex(gas)

    const txHash = await this.rpc('eth_sendTransaction', txData)

    const txWithHash = {
      ...txData,
      input: txData.data,
      hash: txHash
    }

    return normalizeTransactionObject(txWithHash)
  }

  async updateTransactionFee(tx, newGasPrice) {
    const txHash = typeof tx === 'string' ? tx : tx.hash
    const transaction = await this.getTransactionByHash(txHash)

    const txOptions = {
      from: transaction._raw.from,
      to: transaction._raw.to,
      value: new BigNumber(transaction._raw.value),
      gasPrice: new BigNumber(newGasPrice),
      data: transaction._raw.input,
      nonce: hexToNumber(transaction._raw.nonce)
    }

    const txData = buildTransaction(txOptions)

    const gas = await this.getMethod('estimateGas')(txData)
    txData.gas = numberToHex(gas)
    const newTxHash = await this.rpc('eth_sendTransaction', txData)
    const txWithHash = {
      ...txData,
      input: txData.data,
      hash: newTxHash
    }

    return normalizeTransactionObject(txWithHash)
  }

  async sendRawTransaction(hash) {
    // 这里是最终发送 txData 到 rpc节点的地方
    return this.rpc('eth_sendRawTransaction', ensure0x(hash))
  }

  async signMessage(message, from) {
    from = ensure0x(from)
    message = ensure0x(Buffer.from(message).toString('hex'))
    const sig = await this.rpc('eth_sign', from, message)
    return remove0x(sig)
  }

  normalizeBlock(block) {
    const normalizedBlock = {
      hash: remove0x(block.hash),
      parentHash: remove0x(block.parentHash),
      timestamp: hexToNumber(block.timestamp),
      size: hexToNumber(block.size),
      nonce: hexToNumber(block.nonce),
      number: hexToNumber(block.number),
      difficulty: hexToNumber(block.difficulty)
    }
    return normalizedBlock
  }

  async parseBlock(block, includeTx) {
    const normalizedBlock = this.normalizeBlock(block)
    if (block && includeTx) {
      const currentHeight = await this.getBlockHeight()
      normalizedBlock.transactions = block.transactions.map((tx) =>
        normalizeTransactionObject(tx, currentHeight)
      )
    } else {
      normalizedBlock.transactions = block.transactions
    }
    return normalizedBlock
  }

  async getBlockByHash(blockHash, includeTx) {
    const block = await this.rpc<ethereum.Block>('eth_getBlockByHash', ensure0x(blockHash), includeTx)
    if (!block) {
      throw new BlockNotFoundError(`Block not found: ${blockHash}`)
    }
    return this.parseBlock(block, includeTx)
  }

  async getBlockByNumber(blockNumber, includeTx) {
    const block = await this.rpc<ethereum.Block>('eth_getBlockByNumber', numberToHex(blockNumber), includeTx)
    if (!block) {
      throw new BlockNotFoundError(`Block not found: ${blockNumber}`)
    }
    return this.parseBlock(block, includeTx)
  }

  async getBlockHeight() {
    const hexHeight = await this.rpc('eth_blockNumber')
    return hexToNumber(hexHeight)
  }

  async getTransactionByHash(txHash) {
    txHash = ensure0x(txHash)
    const currentBlock = await this.getBlockHeight()
    const tx = await this.rpc('eth_getTransactionByHash', txHash)

    if (!tx) {
      throw new TxNotFoundError(`Transaction not found: ${txHash}`)
    }

    return normalizeTransactionObject(tx, currentBlock)
  }

  async getTransactionReceipt(txHash) {
    txHash = ensure0x(txHash)
    return this.rpc('eth_getTransactionReceipt', txHash)
  }

  async getTransactionCount(address, block = 'latest') {
    address = ensure0x(address)
    const count = await this.rpc('eth_getTransactionCount', address, block)
    return hexToNumber(count)
  }

  async getGasPrice() {
    const gasPrice = await this.rpc('eth_gasPrice')
    return new BigNumber(gasPrice).div(1e9) // Gwei
  }

  async getBalance(_addresses) {
    const addresses = _addresses.map(addressToString).map(ensure0x)
    const promiseBalances = await Promise.all(
      addresses.map((address) => this.rpc('eth_getBalance', address, 'latest'))
    )
    return promiseBalances
      .map((balance) => new BigNumber(balance))
      .reduce((acc, balance) => acc.plus(balance), new BigNumber(0))
  }

  async estimateGas(transaction) {
    // TODO 这里要覆盖一下 transaction 里的 to 和 data
    const { to, value = '0', data } = transaction
    const operation = '0'
    const safeTxGas = ethers.BigNumber.from('0')
    const baseGas = '0'
    const gasPrice = '0'
    const gasToken = '0x0000000000000000000000000000000000000000'
    const refundReceiver = '0x0000000000000000000000000000000000000000'
    const signatures = ethers.utils.arrayify('0x')

    const txData = [
      to,
      ethers.BigNumber.from(value.toString()),  // TODO 原本的 value 是一个很奇怪的BigNumber，会出错，所以这里包一下
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      signatures
    ]

    const toProxyData = rushWalletInterface.encodeFunctionData('execTransaction', txData)
    const newTransaction = {
      to: this.getProxyAddress(),
      data: toProxyData
    }

    const result = await this.rpc('eth_estimateGas', newTransaction)
    const gas = hexToNumber(result)
    if (gas === 21000) return gas
    return Math.ceil(gas * GAS_LIMIT_MULTIPLIER)
  }

  async getCode(address, block) {
    address = ensure0x(String(address))
    block = typeof block === 'number' ? ensure0x(padHexStart(block.toString(16))) : block
    const code = await this.rpc('eth_getCode', address, block)
    return remove0x(code)
  }

  async assertContractExists(address) {
    const code = await this.getCode(address, 'latest')
    if (code === '') throw new InvalidDestinationAddressError(`Contract does not exist at given address: ${address}`)
  }

  async stopMiner() {
    await this.rpc('miner_stop')
  }

  async startMiner() {
    await this.rpc('miner_start')
  }

  async evmMine() {
    await this.rpc('evm_mine')
  }

  async generateBlock(numberOfBlocks) {
    if (numberOfBlocks && numberOfBlocks > 1) {
      throw new Error('Ethereum generation limited to 1 block at a time.')
    }
    try {
      await this.evmMine()
    } catch (e) {
      // Fallback onto geth way of triggering mine
      await this.startMiner()
      await sleep(500) // Give node a chance to mine
      await this.stopMiner()
    }
  }

  getProxyAddress() {
    return this._proxyAddress
  }
}