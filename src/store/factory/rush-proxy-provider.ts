import { ethers } from 'ethers'
import { Provider } from '@/liquality/provider'

import {
  ensure0x,
  remove0x,
  buildTransaction,
  numberToHex,
  hexToNumber,
  normalizeTransactionObject
} from '@/liquality/ethereum-utils'

// import { mnemonicToSeed } from 'bip39'
// import hdkey from 'hdkey'

// import { Transaction as EthJsTransaction } from 'ethereumjs-tx'
// import Common from 'ethereumjs-common'
// import { chains as BaseChains } from 'ethereumjs-common/dist/chains'

import { Address, BigNumber } from '@/liquality/types'
// import { hashPersonalMessage, ecsign, toRpcSig, privateToAddress, privateToPublic } from 'ethereumjs-util'

import { addressToString } from '@/liquality/utils'

interface ProxyTransactionOption {
  from: string;
  to: string;
  data: string;
  value?: BigNumber;
  fee?: number;
}

const GAS_LIMIT_MULTIPLIER = 1.5

const proxyABI = [
  'event ExecutionFailure(bytes32 txHash, uint256 payment)',
  'event ExecutionSuccess(bytes32 txHash, uint256 payment)',
  'function payETH(address to, uint256 amount)',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
  'function requiredTxGas(address to, uint256 value, bytes calldata data, uint8 operation) external returns (uint256)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes memory)',
  'function getOwners() public view returns (address[] memory)',
]

const rushWalletInterface = new ethers.utils.Interface(proxyABI)

export class RushProxyProvider extends Provider {
  _proxyAddress: string;
  _derivationPath: string;
  constructor(options: any) {
    super()
    const { proxyAddress, derivationPath } = options
    this._proxyAddress = proxyAddress
    this._derivationPath = derivationPath
  }

  async getProxyAddresses() {
    const address = new Address({
      address: remove0x(this.getProxyAddress()),
      derivationPath: this._derivationPath
    })
    return [ address ]
  }

  getProxyAddress() {
    return this._proxyAddress
  }

  async getOwners() {
    const proxyAddresses = this.getProxyAddress()
    const callFunctionData = rushWalletInterface.encodeFunctionData('getOwners')

    let owners = await this.getMethod('jsonrpc')(
      'eth_call',
      {
        data: [callFunctionData].join('').toLowerCase(),
        to: ensure0x(proxyAddresses).toLowerCase()
      },
      'latest'
    )
    owners = rushWalletInterface.decodeFunctionResult('getOwners', owners)
    return owners
  }

  async _signPreValidated() {
    /**
     * Pre-Validated Signatures: signature type == 1
     * {32-bytes hash validator}{32-bytes ignored}{1-byte signature type}
     * 最简单的签名:
     * 1. msg.sender 是 owner
     * 2. 交易 dataHash 已经被其他 owner 存到 approvedHashes, 任何人都可以发起交易
     */
    const addresses = await this.getMethod('getAddresses')()
    let address = addresses[0]
    if (typeof address === 'object' && address.address) address = address.address
    const signatures = '0x' + [
      '000000000000000000000000' + remove0x(address),
      '0000000000000000000000000000000000000000000000000000000000000000',
      '01'
    ].join('')
    return signatures
  }
  
  async buildProxyTransactionOptions(options: any): Promise<ProxyTransactionOption> {
    const { to, value = '0', data } = options
    const addresses = await this.getMethod('getAddresses')()
    const from = ensure0x(addresses[0].address)
    const operation = '0'
    const safeTxGas = ethers.BigNumber.from('0')
    const baseGas = '0'
    const gasPrice = '0'
    const gasToken = '0x0000000000000000000000000000000000000000'
    const refundReceiver = '0x0000000000000000000000000000000000000000'
    const signatures = await this._signPreValidated() // ethers.utils.arrayify('0x')

    const proxyTxData = [
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

    const toProxyData = rushWalletInterface.encodeFunctionData('execTransaction', proxyTxData)
    const newTransaction: ProxyTransactionOption = {
      from,
      to: this.getProxyAddress(),
      data: toProxyData
    }
    return newTransaction
  }

  async sendProxyTransaction(options: any) {
    const { to, value, data } = options
    const newOptions: ProxyTransactionOption = await this.buildProxyTransactionOptions({ to, value, data })
    // below is original sendTransaction codes
    const from = newOptions.from
    const [nonce, gasPrice] = await Promise.all([
      this.getMethod('getTransactionCount')(remove0x(from), 'pending'),
      newOptions.fee ? Promise.resolve(new BigNumber(newOptions.fee)) : this.getMethod('getGasPrice')()
    ])

    const txOptions = {
      from,
      to: newOptions.to ? addressToString(newOptions.to) : (newOptions.to),
      value: newOptions.value,
      data: newOptions.data,
      gasPrice,
      nonce
    }

    const txData = buildTransaction(txOptions)

    const gas = await this.getMethod('estimateGas')(txData)
    txData.gas = numberToHex(+gas)

    const serializedTx = await this.getMethod('signTransaction')(txData)
    const txHash = await this.getMethod('sendRawTransaction')(serializedTx)

    const txWithHash = {
      ...txData,
      input: txData.data,
      hash: txHash
    }
    return normalizeTransactionObject(txWithHash)
  }

  async estimateProxyGas(transaction: any) {
    const { to, value, data } = transaction
    const newTransaction = await this.buildProxyTransactionOptions({ to, value, data })
    const rpcFunc = this.getMethod('rpc')
    const result = await rpcFunc('eth_estimateGas', newTransaction)
    const gas = hexToNumber(result)
    if (gas === 21000) return gas
    return Math.ceil(gas * GAS_LIMIT_MULTIPLIER)
  }
}