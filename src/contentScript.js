/* global chrome */
import { inject } from './broker/utils'
import Script from './broker/Script'
import { providerManager, ethereumProvider, overrideEthereum } from './inject'
import buildConfig from './build.config'
import { ChainNetworks } from './store/utils'
import { isEthereumChain } from '@/liquality/cryptoassets'
import { chains } from '@/utils/chains'

;(new Script()).start()

inject(providerManager())

function injectEthereum (state, chain) {
  const network = ChainNetworks[chain][state.activeNetwork]
  inject(ethereumProvider({
    chain,
    asset: chains[chain].nativeAsset,
    network
  }))
}

chrome.storage.local.get(['rush-wallet'], (storage) => {
  const state = storage['rush-wallet']

  buildConfig.chains
    .filter(chain => {
      return isEthereumChain(chain) || chain.toLowerCase() === 'localhost' || chain.toLowerCase() === 'rush'
    })
    .forEach(chain => {
      injectEthereum(state, chain)
    })

  if (state.injectEthereum && state.injectEthereumChain) {
    inject(overrideEthereum(state.injectEthereumChain))
  }
})

