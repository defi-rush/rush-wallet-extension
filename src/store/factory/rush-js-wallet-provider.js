import { ethers } from 'ethers'
import { WalletProvider } from '@/liquality/wallet-provider'
import { EthereumNetwork } from '@/liquality/ethereum-networks'
import {
  remove0x,
  buildTransaction,
  numberToHex,
  hexToNumber,
  normalizeTransactionObject
} from '@/liquality/ethereum-utils'

import { mnemonicToSeed } from 'bip39'
import hdkey from 'hdkey'

import { Transaction as EthJsTransaction } from 'ethereumjs-tx'
import Common from 'ethereumjs-common'
import { chains as BaseChains } from 'ethereumjs-common/dist/chains'

import { Network, Address, SendOptions, ethereum, Transaction, BigNumber } from '@/liquality/types'
import { hashPersonalMessage, ecsign, toRpcSig, privateToAddress, privateToPublic } from 'ethereumjs-util'

import { addressToString } from '@/liquality/utils'

const proxyABI = [
  'event ExecutionFailure(bytes32 txHash, uint256 payment)',
  'event ExecutionSuccess(bytes32 txHash, uint256 payment)',
  'function payETH(address to, uint256 amount)',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
  'function requiredTxGas(address to, uint256 value, bytes calldata data, uint8 operation) external returns (uint256)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes memory)',
]

const rushWalletInterface = new ethers.utils.Interface(proxyABI)

/**
 * overrides EthereumJsWalletProvider
 * 创建 client 的时候会 addProvider，所以合约钱包的作用就是截取请求，统一发给 proxyAddress
 */
export class RushJsWalletProvider extends WalletProvider {
  constructor(options) {
    const { network, mnemonic, derivationPath, hardfork = 'istanbul', proxyAddress, wallet } = options
    super({ network })

    this._derivationPath = derivationPath
    this._mnemonic = mnemonic
    this._network = network
    this._hardfork = hardfork

    this._proxyAddress = proxyAddress;
    this.wallet = ethers.Wallet.fromMnemonic(wallet.mnemonic);
  }

  async node() {
    const seed = await mnemonicToSeed(this._mnemonic)
    return hdkey.fromMasterSeed(seed)
  }

  async hdKey() {
    const node = await this.node()
    return node.derive(this._derivationPath)
  }

  async signMessage(message) {
    const hdKey = await this.hdKey()
    const msgHash = hashPersonalMessage(Buffer.from(message))

    const { v, r, s } = ecsign(msgHash, hdKey.privateKey)

    return remove0x(toRpcSig(v, r, s))
  }

  async getAddresses() {
    const hdKey = await this.hdKey()
    const address = privateToAddress(hdKey.privateKey).toString('hex')
    const publicKey = privateToPublic(hdKey.privateKey).toString('hex')
    return [
      new Address({
        address,
        derivationPath: this._derivationPath,
        publicKey
      })
    ]
  }

  async getUnusedAddress() {
    const addresses = await this.getAddresses()
    return addresses[0]
  }

  async getUsedAddresses() {
    throw new Error('getUsedAddresses 已被废弃')
    // return this.getAddresses()
  }

  async signTransaction(txData) {
    const hdKey = await this.hdKey()

    let common
    if (!(this._network.name === 'local')) {
      const baseChain = this._network.name in BaseChains ? this._network.name : 'mainnet'
      common = Common.forCustomChain(
        baseChain,
        {
          ...this._network
        },
        this._hardfork
      )
    }

    const tx = new EthJsTransaction(txData, { common })
    tx.sign(hdKey.privateKey)

    return tx.serialize().toString('hex')
  }

  async sendSweepTransaction(address, _gasPrice) {
    const addresses = await this.getAddresses()

    const balance = await this.client.chain.getBalance(addresses)

    const [gasPrice] = await Promise.all([_gasPrice ? Promise.resolve(_gasPrice) : this.getMethod('getGasPrice')()])

    const fees = gasPrice.times(21000).times('1000000000')
    const amountToSend = balance.minus(fees)

    const sendOptions = {
      to: address,
      value: amountToSend,
      data: null,
      fee: gasPrice
    }

    return this.sendTransaction(sendOptions)
  }

  async updateTransactionFee(tx, newGasPrice) {
    const transaction =
      typeof tx === 'string' ? await this.getMethod('getTransactionByHash')(tx) : tx

    const txOptions = {
      from: transaction._raw.from,
      to: transaction._raw.to,
      value: new BigNumber(transaction._raw.value),
      gasPrice: new BigNumber(newGasPrice),
      data: transaction._raw.input,
      nonce: hexToNumber(transaction._raw.nonce)
    }

    const txData = await buildTransaction(txOptions)
    const gas = await this.getMethod('estimateGas')(txData)
    txData.gas = numberToHex(gas)

    const serializedTx = await this.signTransaction(txData)
    const newTxHash = await this.getMethod('sendRawTransaction')(serializedTx)

    const txWithHash = {
      ...txData,
      input: txData.data,
      hash: newTxHash
    }

    return normalizeTransactionObject(txWithHash)
  }

  async isWalletAvailable() {
    return true
  }

  async getConnectedNetwork() {
    return this._network
  }

  async getProxyAddresses() {
    const address = new Address({
      address: remove0x(this.getProxyAddress()),
      derivationPath: this._derivationPath
    })
    return [ address ]
  }

  getProxyAddress() {
    return this._proxyAddress;
  }

  async _signPreValidated() {
    /**
     * Pre-Validated Signatures: signature type == 1
     * {32-bytes hash validator}{32-bytes ignored}{1-byte signature type}
     * 最简单的签名:
     * 1. msg.sender 是 owner
     * 2. 交易 dataHash 已经被其他 owner 存到 approvedHashes, 任何人都可以发起交易
     */
    const addresses = await this.getAddresses()
    let address = addresses[0]
    if (typeof address === 'object' && address.address) address = address.address
    const signatures = '0x' + [
      '000000000000000000000000' + remove0x(address),
      '0000000000000000000000000000000000000000000000000000000000000000',
      '01'
    ].join('')
    return signatures
  }

  async sendTransaction(options) {
    const { to, value, data } = options
    const addresses = await this.getMethod('getAddresses')()
    const from = addresses[0].address
    const operation = '0'
    const safeTxGas = ethers.BigNumber.from('0')
    const baseGas = '0'
    const gasPrice = '0'
    const gasToken = '0x0000000000000000000000000000000000000000'
    const refundReceiver = '0x0000000000000000000000000000000000000000'
    const signatures = await this._signPreValidated() // ethers.utils.arrayify('0x')

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
      from,
      to: this.getProxyAddress(),
      data: toProxyData
    }

    return await this._execSendTransaction(newTransaction)
  }

  async _execSendTransaction(options) {
    const from = options.from
    const [nonce, gasPrice] = await Promise.all([
      this.getMethod('getTransactionCount')(remove0x(from), 'pending'),
      options.fee ? Promise.resolve(new BigNumber(options.fee)) : this.getMethod('getGasPrice')()
    ])

    const txOptions = {
      from,
      to: options.to ? addressToString(options.to) : (options.to),
      value: options.value,
      data: options.data,
      gasPrice,
      nonce
    }

    const txData = buildTransaction(txOptions)

    const gas = await this.getMethod('estimateGas')(txData)
    txData.gas = numberToHex(+gas)

    const serializedTx = await this.signTransaction(txData)
    const txHash = await this.getMethod('sendRawTransaction')(serializedTx)

    const txWithHash = {
      ...txData,
      input: txData.data,
      hash: txHash
    }
    return normalizeTransactionObject(txWithHash)
  }
}