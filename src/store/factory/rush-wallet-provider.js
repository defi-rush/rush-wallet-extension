import { ethers } from 'ethers'
import { EthereumRpcProvider } from '@liquality/ethereum-rpc-provider'

const rushWalletInterface = new ethers.utils.Interface([
  'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver)',
  'function encodeTransactionData(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) public view returns (bytes memory)'
]);

/**
 * 创建 client 的时候会 addProvider，所以合约钱包的作用就是截取请求，统一发给 proxyAddress
 */
export class RushWalletProvider extends EthereumRpcProvider {
  constructor({ proxyAddress, rushWalletAddress, rushWalletProxyFactoryAddress, ...restOptions }) {
    super(restOptions);
    this._proxyAddress = proxyAddress;
  }

  getProxyAddress() {
    return this._proxyAddress;
  }

  sendRawTransaction(hash) {
    return super.sendRawTransaction(hash)
  }

  // sendTransaction(options) {
  //   const toProxyData = rushWalletInterface.encodeFunctionData('encodeTransactionData', options)
  //   const toProxyOptions = {
  //     to: this.getProxyAddress(),
  //     data: toProxyData
  //   }
  //   console.log('### RushWalletProvider.sendTransaction', toProxyOptions)
  //   return super.sendTransaction(toProxyOptions)
  // }
}