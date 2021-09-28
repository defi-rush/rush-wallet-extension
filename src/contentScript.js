/* global chrome */
import { inject } from './broker/utils'
import Script from './broker/Script'
import { providerManager, ethereumProvider, overrideEthereum } from './inject'
import { getNativeAssetSymbol } from '@/constants/chains'

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
  const nativeAsset = getNativeAssetSymbol({ chainId: chainId || 1 })

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
    // 如果勾选，则inject window.ethereum 并且覆盖
    injectEthereum(state, 'ethereum')
    inject(overrideEthereum('ethereum'))
    // inject(overrideEthereum(state.injectEthereumChain))
  }
})

