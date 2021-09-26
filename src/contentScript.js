/* global chrome */
import { inject } from './broker/utils'
import Script from './broker/Script'
import { providerManager, ethereumProvider, overrideEthereum } from './inject'
import buildConfig from './build.config'
import { ChainNetworks } from './store/utils'
import { isEthereumChain } from '@/liquality/cryptoassets'
import { chains } from '@/utils/chains'
import { CHAIN_NATIVE_ASSET_MAPPING } from '@/constants/chains'

;(new Script()).start()

inject(providerManager())

function injectEthereum (state, chain) {
  // const network = ChainNetworks[chain][state.activeNetwork]
  const { activeProxyAddressIndex, proxyAddresses } = state
  const activeProxyAddress = (proxyAddresses && activeProxyAddressIndex >= 0) ? proxyAddresses[activeProxyAddressIndex] : null
  const chainId = activeProxyAddress ? activeProxyAddress.chainId : null
  const network = {
    networkId: chainId,
    chainId,
  }
  const nativeAsset = CHAIN_NATIVE_ASSET_MAPPING[chainId || 1]

  inject(ethereumProvider({
    chain,
    asset: nativeAsset,
    network
  }))
}

chrome.storage.local.get(['rush-wallet'], (storage) => {
  const state = storage['rush-wallet']
  injectEthereum(state, 'rush')

  if (state.injectEthereum && state.injectEthereumChain) {
    inject(overrideEthereum(state.injectEthereumChain))
  }
})

