import { Client } from '@liquality/client'

// import { EthereumRpcProvider } from '@liquality/ethereum-rpc-provider'
// import { EthereumJsWalletProvider } from '@liquality/ethereum-js-wallet-provider'
import { RushJsWalletProvider } from './rush-js-wallet-provider'
import { EthereumSwapProvider } from '@liquality/ethereum-swap-provider'
import { EthereumScraperSwapFindProvider } from '@liquality/ethereum-scraper-swap-find-provider'
import { EthereumGasNowFeeProvider } from '@liquality/ethereum-gas-now-fee-provider'
import { EthereumRpcFeeProvider } from '@liquality/ethereum-rpc-fee-provider'

import { EthereumErc20Provider } from '@liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@liquality/ethereum-erc20-swap-provider'
import { EthereumErc20ScraperSwapFindProvider } from '@liquality/ethereum-erc20-scraper-swap-find-provider'


import {
  EthereumLedgerBridgeProvider,
  EthereumLedgerBridgeApp,
} from '@/utils/ledger-bridge-provider'
import { chains } from '@/utils/chains'

import { isERC20 } from '@/utils/asset'
import cryptoassets from '@/utils/cryptoassets'
import { ChainNetworks } from '@/store/utils'
import store from '../../store'
import { RushRpcProvider } from './rush-rpc-provider'

const proxyAddress                  = '0x1a609970Bb5daD3B6DE9F316a4c322519B562042'
const rushWalletAddress             = '0xAbB12158488d9C9Bd52C14B9AE4C835eCE4A6e13'
const rushWalletProxyFactoryAddress = '0x446C29FBFEF829F81E236a2376191F648dbEF995'

export function createRuchClient (asset, network, mnemonic, walletType, indexPath) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.localhost[network]
  const infuraApi = 'http://localhost:8545'
  const scraperApi = isTestnet ? 'https://liquality.io/eth-ropsten-api' : 'https://liquality.io/eth-mainnet-api'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  const ethClient = new Client()
  const rushRpcProvider = new RushRpcProvider({
    proxyAddress,
    uri: infuraApi
  })

  ethClient.addProvider(rushRpcProvider)

  const rskLegacyCoinType = ethereumNetwork.name === 'rsk_mainnet' ? '137' : '37310'
  const { rskLegacyDerivation, wallets, activeWalletId } = store.state
  const wallet = wallets.find(wallet => wallet.id === activeWalletId)
  let coinType = ethereumNetwork.coinType

  if (walletType === 'rsk_ledger') {
    coinType = rskLegacyCoinType
  } else if (ethereumNetwork.name === 'rsk_mainnet' || ethereumNetwork.name === 'rsk_testnet') {
    coinType = rskLegacyDerivation ? rskLegacyCoinType : ethereumNetwork.coinType
  }

  const derivationPath = `m/44'/${coinType}'/${indexPath}'/0/0`

  if (walletType === 'ethereum_ledger' || walletType === 'rsk_ledger') {
    const assetData = cryptoassets[asset]
    const chainData = chains?.[assetData.chain]
    const { nativeAsset } = chainData || 'ETH'
    const ethereumLedgerApp = new EthereumLedgerBridgeApp(network, nativeAsset)
    const ledger = new EthereumLedgerBridgeProvider(
      {
        network: ethereumNetwork,
        derivationPath
      },
      ethereumLedgerApp
    )
    ethClient.addProvider(ledger)
  } else {
    ethClient.addProvider(new RushJsWalletProvider(
      { network: ethereumNetwork, mnemonic, derivationPath, proxyAddress, wallet}
    ))
  }

  if (isERC20(asset)) {
    const contractAddress = cryptoassets[asset].contractAddress
    ethClient.addProvider(new EthereumErc20Provider(contractAddress))
    ethClient.addProvider(new EthereumErc20SwapProvider())
    if (scraperApi) ethClient.addProvider(new EthereumErc20ScraperSwapFindProvider(scraperApi))
  } else {
    ethClient.addProvider(new EthereumSwapProvider())
    if (scraperApi) ethClient.addProvider(new EthereumScraperSwapFindProvider(scraperApi))
  }
  ethClient.addProvider(feeProvider)

  return ethClient
}