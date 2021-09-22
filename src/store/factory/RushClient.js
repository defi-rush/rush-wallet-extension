import { Client } from '@/liquality/client'

import { EthereumRpcProvider } from '@/liquality/ethereum-rpc-provider'
import { EthereumJsWalletProvider } from '@/liquality/ethereum-js-wallet-provider'
import { RushJsWalletProvider } from './rush-js-wallet-provider'
import { EthereumSwapProvider } from '@/liquality/ethereum-swap-provider'
import { EthereumGasNowFeeProvider } from '@/liquality/ethereum-gas-now-fee-provider'

import { EthereumErc20Provider } from '@/liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@/liquality/ethereum-erc20-swap-provider'
import { RushProxyProvider } from './rush-proxy-provider'


import { isERC20 } from '@/utils/asset'
import cryptoassets from '@/utils/cryptoassets'
import { ChainNetworks } from '@/store/utils'
import store from '../../store'
import { RushRpcProvider } from './rush-rpc-provider'
import { CHAIN_ID_RPC_MAPPING } from '@/constants/chains'

export function createRuchClient ({asset, mnemonic, indexPath, proxyAddress, chainId = 1}) {
  const ethereumNetwork = ChainNetworks.rush['mainnet']
  const infuraApi = CHAIN_ID_RPC_MAPPING[chainId]
  const feeProvider = new EthereumGasNowFeeProvider()

  const ethClient = new Client()
  // const rushRpcProvider = new RushRpcProvider({
  //   proxyAddress,
  //   uri: infuraApi
  // })
  ethClient.addProvider(new EthereumRpcProvider({ uri: infuraApi }))

  const { wallets, activeWalletId } = store.state
  const wallet = wallets.find(wallet => wallet.id === activeWalletId)
  let coinType = ethereumNetwork.coinType

  const derivationPath = `m/44'/${coinType}'/${indexPath}'/0/0`
  // ethClient.addProvider(new RushJsWalletProvider(
  //   { network: ethereumNetwork, mnemonic, derivationPath, proxyAddress, wallet}
  // ))
  ethClient.addProvider(new EthereumJsWalletProvider(
    { network: ethereumNetwork, mnemonic, derivationPath }
  ))

  if (isERC20(asset)) {
    const contractAddress = cryptoassets[asset].contractAddress
    ethClient.addProvider(new EthereumErc20Provider(contractAddress))
    ethClient.addProvider(new EthereumErc20SwapProvider())
  } else {
    ethClient.addProvider(new EthereumSwapProvider())
  }
  ethClient.addProvider(feeProvider)
  ethClient.addProvider(new RushProxyProvider({
    proxyAddress, 
    derivationPath
  }))
  return ethClient
}