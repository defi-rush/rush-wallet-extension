import { Client } from '@/liquality/client'

// import { EthereumRpcProvider } from '@/liquality/ethereum-rpc-provider'
// import { EthereumJsWalletProvider } from '@/liquality/ethereum-js-wallet-provider'
import { RushJsWalletProvider } from './rush-js-wallet-provider'
import { EthereumSwapProvider } from '@/liquality/ethereum-swap-provider'
import { EthereumScraperSwapFindProvider } from '@/liquality/ethereum-scraper-swap-find-provider'
import { EthereumGasNowFeeProvider } from '@/liquality/ethereum-gas-now-fee-provider'
import { EthereumRpcFeeProvider } from '@/liquality/ethereum-rpc-fee-provider'

import { EthereumErc20Provider } from '@/liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@/liquality/ethereum-erc20-swap-provider'
import { EthereumErc20ScraperSwapFindProvider } from '@/liquality/ethereum-erc20-scraper-swap-find-provider'


import { isERC20 } from '@/utils/asset'
import cryptoassets from '@/utils/cryptoassets'
import { ChainNetworks } from '@/store/utils'
import store from '../../store'
import { RushRpcProvider } from './rush-rpc-provider'

export function createRuchClient (asset, network, mnemonic, walletType, indexPath, proxyAddress) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.rush[network]
  const infuraApi = 'http://localhost:8545'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  const ethClient = new Client()
  const rushRpcProvider = new RushRpcProvider({
    proxyAddress,
    uri: infuraApi
  })

  ethClient.addProvider(rushRpcProvider)

  const { wallets, activeWalletId } = store.state
  const wallet = wallets.find(wallet => wallet.id === activeWalletId)
  let coinType = ethereumNetwork.coinType

  const derivationPath = `m/44'/${coinType}'/${indexPath}'/0/0`
  ethClient.addProvider(new RushJsWalletProvider(
    { network: ethereumNetwork, mnemonic, derivationPath, proxyAddress, wallet}
  ))

  if (isERC20(asset)) {
    const contractAddress = cryptoassets[asset].contractAddress
    ethClient.addProvider(new EthereumErc20Provider(contractAddress))
    ethClient.addProvider(new EthereumErc20SwapProvider())
  } else {
    ethClient.addProvider(new EthereumSwapProvider())
  }
  ethClient.addProvider(feeProvider)

  return ethClient
}