import { Client } from '@liquality/client'

import { EthereumRpcProvider } from '@liquality/ethereum-rpc-provider'
import { EthereumJsWalletProvider } from '@liquality/ethereum-js-wallet-provider'
import { EthereumSwapProvider } from '@liquality/ethereum-swap-provider'
import { EthereumScraperSwapFindProvider } from '@liquality/ethereum-scraper-swap-find-provider'
import { EthereumGasNowFeeProvider } from '@liquality/ethereum-gas-now-fee-provider'
import { EthereumRpcFeeProvider } from '@liquality/ethereum-rpc-fee-provider'

import { EthereumErc20Provider } from '@liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@liquality/ethereum-erc20-swap-provider'
import { EthereumErc20ScraperSwapFindProvider } from '@liquality/ethereum-erc20-scraper-swap-find-provider'

import { NearSwapProvider } from '@liquality/near-swap-provider'
import { NearJsWalletProvider } from '@liquality/near-js-wallet-provider'
import { NearRpcProvider } from '@liquality/near-rpc-provider'
import { NearSwapFindProvider } from '@liquality/near-swap-find-provider'

import { createRuchClient } from './RushClient'

import {
  EthereumLedgerBridgeProvider,
  EthereumLedgerBridgeApp,
} from '@/utils/ledger-bridge-provider'
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
    ethClient.addProvider(new EthereumJsWalletProvider(
      { network: ethereumNetwork, mnemonic, derivationPath }
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

function createEthClient (asset, network, mnemonic, walletType, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.ethereum[network]
  const infuraApi = isTestnet ? `https://ropsten.infura.io/v3/${buildConfig.infuraApiKey}` : `https://mainnet.infura.io/v3/${buildConfig.infuraApiKey}`
  const scraperApi = isTestnet ? 'https://liquality.io/eth-ropsten-api' : 'https://liquality.io/eth-mainnet-api'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  return createEthereumClient(asset, network, ethereumNetwork, infuraApi, scraperApi, feeProvider, mnemonic, walletType, indexPath)
}

function createNearClient (network, mnemonic, indexPath = 0) {
  const nearNetwork = ChainNetworks.near[network]
  const nearClient = new Client()
  const derivationPath = `m/44'/${nearNetwork.coinType}'/${indexPath}'`
  nearClient.addProvider(new NearRpcProvider(nearNetwork))
  nearClient.addProvider(new NearJsWalletProvider(
    {
      network: nearNetwork,
      mnemonic,
      derivationPath
    }
  ))
  nearClient.addProvider(new NearSwapProvider())
  nearClient.addProvider(new NearSwapFindProvider(nearNetwork?.helperUrl))

  return nearClient
}

function createRskClient (asset, network, mnemonic, walletType, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const rskNetwork = ChainNetworks.rsk[network]
  const rpcApi = isTestnet ? 'https://public-node.testnet.rsk.co' : 'https://public-node.rsk.co'
  const scraperApi = isTestnet ? 'https://liquality.io/rsk-testnet-api' : 'https://liquality.io/rsk-mainnet-api'
  const feeProvider = new EthereumRpcFeeProvider({ slowMultiplier: 1, averageMultiplier: 1, fastMultiplier: 1.25 })

  return createEthereumClient(asset, network, rskNetwork, rpcApi, scraperApi, feeProvider, mnemonic, walletType, indexPath)
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

function createArbitrumClient (asset, network, mnemonic, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const arbitrumNetwork = ChainNetworks.arbitrum[network]
  const rpcApi = isTestnet ? 'https://rinkeby.arbitrum.io/rpc' : 'https://arb1.arbitrum.io/rpc'
  const scraperApi = isTestnet ? 'https://liquality.io/arbitrum-testnet-api' : 'https://liquality.io/arbitrum-mainnet-api'
  const feeProvider = new EthereumRpcFeeProvider({ slowMultiplier: 1, averageMultiplier: 1, fastMultiplier: 1.25 })

  return createEthereumClient(asset, network, arbitrumNetwork, rpcApi, scraperApi, feeProvider, mnemonic, 'default', indexPath)
}

function createLocalhostClient (asset, network, mnemonic, walletType, indexPath = 0) {
  const isTestnet = network === 'testnet'
  const ethereumNetwork = ChainNetworks.localhost[network]
  const infuraApi = 'http://localhost:8545'
  const scraperApi = isTestnet ? 'https://liquality.io/eth-ropsten-api' : 'https://liquality.io/eth-mainnet-api'
  const feeProvider = isTestnet ? new EthereumRpcFeeProvider() : new EthereumGasNowFeeProvider()

  return createEthereumClient(asset, network, ethereumNetwork, infuraApi, scraperApi, feeProvider, mnemonic, walletType, indexPath)
}
export const createClient = (asset, network, mnemonic, walletType, indexPath = 0, proxyAddress) => {
  const assetData = cryptoassets[asset]
  if (assetData.chain === 'rsk') return createRskClient(asset, network, mnemonic, walletType, indexPath)
  if (assetData.chain === 'bsc') return createBSCClient(asset, network, mnemonic, indexPath)
  if (assetData.chain === 'polygon') return createPolygonClient(asset, network, mnemonic, indexPath)
  if (assetData.chain === 'arbitrum') return createArbitrumClient(asset, network, mnemonic, indexPath)
  if (assetData.chain === 'near') return createNearClient(network, mnemonic, indexPath)
  if (assetData.chain === 'localhost') return createLocalhostClient(asset, network, mnemonic, walletType, indexPath)
  if (assetData.chain === 'rush') return createRuchClient(asset, network, mnemonic, walletType, indexPath, proxyAddress)

  return createEthClient(asset, network, mnemonic, walletType, indexPath)
}
