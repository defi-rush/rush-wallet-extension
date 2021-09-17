import { Client } from '@/liquality/client'

import { EthereumRpcProvider } from '@/liquality/ethereum-rpc-provider'
import { EthereumJsWalletProvider } from '@/liquality/ethereum-js-wallet-provider'
import { EthereumSwapProvider } from '@/liquality/ethereum-swap-provider'
import { EthereumScraperSwapFindProvider } from '@/liquality/ethereum-scraper-swap-find-provider'
import { EthereumGasNowFeeProvider } from '@/liquality/ethereum-gas-now-fee-provider'
import { EthereumRpcFeeProvider } from '@/liquality/ethereum-rpc-fee-provider'

import { EthereumErc20Provider } from '@/liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@/liquality/ethereum-erc20-swap-provider'
import { EthereumErc20ScraperSwapFindProvider } from '@/liquality/ethereum-erc20-scraper-swap-find-provider'

import { createRuchClient } from './RushClient'

import { chains } from '@/utils/chains'

import { isERC20 } from '@/utils/asset'
import cryptoassets from '@/utils/cryptoassets'
import buildConfig from '../../build.config'
import { ChainNetworks } from '@/store/utils'
import store from '../../store'

function createEthereumClient (
  asset,
  network,
  ethereumNetwork,
  rpcApi,
  scraperApi,
  feeProvider,
  mnemonic,
  walletType,
  indexPath = 0
) {
  const ethClient = new Client()
  ethClient.addProvider(new EthereumRpcProvider({ uri: rpcApi }))

  const rskLegacyCoinType = ethereumNetwork.name === 'rsk_mainnet' ? '137' : '37310'
  const { rskLegacyDerivation } = store.state
  let coinType = ethereumNetwork.coinType

  if (ethereumNetwork.name === 'rsk_mainnet' || ethereumNetwork.name === 'rsk_testnet') {
    coinType = rskLegacyDerivation ? rskLegacyCoinType : ethereumNetwork.coinType
  }

  const derivationPath = `m/44'/${coinType}'/${indexPath}'/0/0`

  ethClient.addProvider(new EthereumJsWalletProvider(
    { network: ethereumNetwork, mnemonic, derivationPath }
  ))

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

function createEthClient (asset, network, mnemonic, walletType, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.ethereum[network]
  const infuraApi = isTestnet ? `https://ropsten.infura.io/v3/${buildConfig.infuraApiKey}` : `https://mainnet.infura.io/v3/${buildConfig.infuraApiKey}`
  const scraperApi = isTestnet ? 'https://liquality.io/eth-ropsten-api' : 'https://liquality.io/eth-mainnet-api'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  return createEthereumClient(asset, network, ethereumNetwork, infuraApi, scraperApi, feeProvider, mnemonic, walletType, indexPath)
}

function createBSCClient (asset, network, mnemonic, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const bnbNetwork = ChainNetworks.bsc[network]
  const rpcApi = isTestnet ? 'https://data-seed-prebsc-1-s1.binance.org:8545' : 'https://bsc-dataseed.binance.org'
  const scraperApi = isTestnet ? 'https://liquality.io/bsc-testnet-api' : 'https://liquality.io/bsc-mainnet-api'
  const feeProvider = new EthereumRpcFeeProvider({ slowMultiplier: 1, averageMultiplier: 1, fastMultiplier: 1.25 })

  return createEthereumClient(asset, network, bnbNetwork, rpcApi, scraperApi, feeProvider, mnemonic, 'default', indexPath)
}

function createPolygonClient (asset, network, mnemonic, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const polygonNetwork = ChainNetworks.polygon[network]
  const rpcApi = isTestnet ? 'https://rpc-mumbai.maticvigil.com' : 'https://rpc-mainnet.maticvigil.com'
  const scraperApi = isTestnet ? 'https://liquality.io/polygon-testnet-api' : 'https://liquality.io/polygon-mainnet-api'
  const feeProvider = new EthereumRpcFeeProvider({ slowMultiplier: 1, averageMultiplier: 1, fastMultiplier: 1.25 })

  return createEthereumClient(asset, network, polygonNetwork, rpcApi, scraperApi, feeProvider, mnemonic, 'default', indexPath)
}


function createLocalhostClient (asset, network, mnemonic, walletType, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.localhost[network]
  const infuraApi = 'http://localhost:8545'
  const scraperApi = isTestnet ? 'https://liquality.io/eth-ropsten-api' : 'https://liquality.io/eth-mainnet-api'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  return createEthereumClient(asset, network, ethereumNetwork, infuraApi, scraperApi, feeProvider, mnemonic, walletType, indexPath)
}
export const createClient = (asset, network, mnemonic, walletType, indexPath = 0, proxyAddress, chainId) => {
  const assetData = cryptoassets[asset]
  if (assetData.chain === 'bsc') return createBSCClient(asset, network, mnemonic, indexPath)
  if (assetData.chain === 'polygon') return createPolygonClient(asset, network, mnemonic, indexPath)
  if (assetData.chain === 'localhost') return createLocalhostClient(asset, network, mnemonic, walletType, indexPath)
  if (assetData.chain === 'rush') return createRuchClient({asset, mnemonic, indexPath, proxyAddress, chainId})

  return createEthClient(asset, network, mnemonic, walletType, indexPath)
}
