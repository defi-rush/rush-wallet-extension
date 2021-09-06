import { ethers } from 'ethers'
import { EthereumJsWalletProvider } from '@liquality/ethereum-js-wallet-provider'

const proxyABI = [
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)',
  'function requiredTxGas(address to, uint256 value, bytes calldata data, uint8 operation) external returns (uint256)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes memory)',
]

const rushWalletInterface = new ethers.utils.Interface(proxyABI)

/**
 * 创建 client 的时候会 addProvider，所以合约钱包的作用就是截取请求，统一发给 proxyAddress
 */
export class RushJsWalletProvider extends EthereumJsWalletProvider {
  constructor({ proxyAddress, ...restOptions }) {
    super(restOptions);
    this._proxyAddress = proxyAddress;
  }

  getProxyAddress() {
    return this._proxyAddress;
  }

  sendRawTransaction(hash) {
    console.log('@@@ RushJsWalletProvider.sendRawTransaction', hash)
    return super.sendRawTransaction(hash)
  }

  sendTransaction(options) {
    console.log('@@@ RushJsWalletProvider.sendTransaction', options)

    const { to, value, data } = options
    console.log('@@@ value is', value.toString(), ethers.utils.parseEther('0'))
    const operation = '0'
    const safeTxGas = ethers.BigNumber.from('4561177')
    const baseGas = '0'
    const gasPrice = '0'
    const gasToken = '0x0000000000000000000000000000000000000000'
    const refundReceiver = '0x0000000000000000000000000000000000000000'
    const signatures = ethers.BigNumber.from('0')

    const txData = [
      to,
      ethers.utils.parseEther(value.toString()),  // TODO 原本的 value 是一个很奇怪的BigNumber，会出错，所以这里包一下
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      signatures
    ]
    const toProxyData = rushWalletInterface.encodeFunctionData('encodeTransactionData', txData)
    const toProxyOptions = {
      to: this.getProxyAddress(),
      data: toProxyData
    }
    console.log('@@@ RushJsWalletProvider.sendTransaction', toProxyOptions)
    return super.sendTransaction(toProxyOptions)
  }
}