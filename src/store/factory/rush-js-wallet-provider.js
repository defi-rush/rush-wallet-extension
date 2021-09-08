import { ethers } from 'ethers'
import { EthereumJsWalletProvider } from '@liquality/ethereum-js-wallet-provider'

import { Network, Address, SendOptions, ethereum, Transaction, BigNumber } from '@liquality/types'
import {
  remove0x,
  buildTransaction,
  numberToHex,
  hexToNumber,
  normalizeTransactionObject
} from '@liquality/ethereum-utils'
import { addressToString } from '@liquality/utils'

const proxyABI = [
  'event ExecutionFailure(bytes32 txHash, uint256 payment)',
  'event ExecutionSuccess(bytes32 txHash, uint256 payment)',
  'function payETH(address to, uint256 amount)',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
  'function requiredTxGas(address to, uint256 value, bytes calldata data, uint8 operation) external returns (uint256)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes memory)',
]

const rushWalletInterface = new ethers.utils.Interface(proxyABI)
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

/**
 * 创建 client 的时候会 addProvider，所以合约钱包的作用就是截取请求，统一发给 proxyAddress
 */
export class RushJsWalletProvider extends EthereumJsWalletProvider {
  constructor({ proxyAddress, wallet, ...restOptions }) {
    super(restOptions);
    this._proxyAddress = proxyAddress;
    this.wallet = ethers.Wallet.fromMnemonic(wallet.mnemonic);
  }

  getProxyAddress() {
    return this._proxyAddress;
  }

  async sendTransaction(options) {
    const { to, value, data } = options
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
    const toProxyOptions = {
      to: this.getProxyAddress(),
      data: toProxyData
    }

    return await this._execSendTransaction({
      ...options,
      ...toProxyOptions,
    }, txData)
  }

  async _execEstimateGas(txData) {
    const rushWalletProxy = new ethers.Contract(this.getProxyAddress(), proxyABI, provider)
    let _estimateGas = await rushWalletProxy.estimateGas.execTransaction(...txData)
    _estimateGas = numberToHex(Math.ceil(+_estimateGas * 2))
    console.log('@@@ _estimateGas', _estimateGas)
    return _estimateGas
  }

  async _execSendTransaction(options, execTransactionTxData) {
    const addresses = await this.getAddresses()
    const from = addresses[0].address

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
    // const gas = await this._execEstimateGas(execTransactionTxData)
    // txData.gas = numberToHex(100000) // TODO test for rushWalletProxy
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