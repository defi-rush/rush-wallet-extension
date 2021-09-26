import _ from 'lodash'
import { Client } from '@/liquality/client'

import { EthereumRpcProvider } from '@/liquality/ethereum-rpc-provider'
import { EthereumJsWalletProvider } from '@/liquality/ethereum-js-wallet-provider'
import { EthereumSwapProvider } from '@/liquality/ethereum-swap-provider'
import { EthereumGasNowFeeProvider } from '@/liquality/ethereum-gas-now-fee-provider'

import { EthereumErc20Provider } from '@/liquality/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@/liquality/ethereum-erc20-swap-provider'
import { RushProxyProvider } from './rush-proxy-provider'

import { ChainNetworks } from '@/store/utils'
import { CHAIN_ID_RPC_MAPPING } from '@/constants/chains'

const getNetworkByChainId = (chainId) => {
  let result
  _.forEach(ChainNetworks, ({ mainnet }, chainName) => {
    if (mainnet.chainId === chainId) {
      result = mainnet
    }
  })
  return result
}

export function createRuchClient ({asset, mnemonic, indexPath, proxyAddress, chainId = 1}) {
  // const ethereumNetwork = ChainNetworks.ethereum['mainnet']
  const network = getNetworkByChainId(chainId)
  const infuraApi = CHAIN_ID_RPC_MAPPING[chainId]
  const feeProvider = new EthereumGasNowFeeProvider()

  const ethClient = new Client()
  ethClient.addProvider(new EthereumRpcProvider({ uri: infuraApi }))

  let coinType = network?.coinType

  const derivationPath = `m/44'/${coinType}'/${indexPath}'/0/0`
  ethClient.addProvider(new EthereumJsWalletProvider(
    { network, mnemonic, derivationPath }
  ))
  
  if (asset.type === 'erc20') {
    const contractAddress = asset.contractAddress
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