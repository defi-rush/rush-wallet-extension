import 'setimmediate'
import { random } from 'lodash-es'
import store from './store'
import { wait } from './store/utils'

function asyncLoop (fn, delay) {
  return wait(delay())
    .then(() => fn())
    .then(() => asyncLoop(fn, delay))
}

store.subscribe(async ({ type, payload }, state) => {
  switch (type) {
    case 'CHANGE_ACTIVE_NETWORK':
      store.dispatch('initializeAddresses', { network: state.activeNetwork, walletId: state.activeWalletId })
      store.dispatch('updateBalances', { network: state.activeNetwork, walletId: state.activeWalletId })
      break
    
    case 'SET_ACTIVE_PROXY_ADDRESS_INDEX':
      // TODO 这里 updateBalances 应该是传入 activeOwnerKey，通过对应的助记词来获取钱包
      // store.dispatch('initializeAddresses', { network: state.activeNetwork, walletId: state.activeWalletId })
      // store.dispatch('updateBalances', { network: state.activeNetwork, walletId: state.activeWalletId, useCache: false })

      store.dispatch('updateProxyAddressAccountAssets')
      store.dispatch('updateProxyAddressAccountBalances', { useCache: false })
      break

    case 'UNLOCK_WALLET':
      store.dispatch('trackAnalytics', {
        event: 'Wallet Unlock',
        properties: {
          category: 'Unlock Wallet',
          action: 'Unlock Wallet',
          label: 'Unlock Wallet'
        }
      })
      store.dispatch('checkAnalyticsOptIn')
      // store.dispatch('initializeAddresses', { network: state.activeNetwork, walletId: state.activeWalletId })
      // store.dispatch('updateBalances', { network: state.activeNetwork, walletId: state.activeWalletId })
      store.dispatch('updateFiatRates', { assets: store.getters.allNetworkAssets })

      store.dispatch('updateProxyAddressAccountAssets')
      store.dispatch('updateProxyAddressAccountBalances', { useCache: false })
      store.dispatch('checkPendingActions', { walletId: state.activeWalletId })

      asyncLoop(
        () => store.dispatch('updateProxyAddressAccountBalances', { useCache: false }),
        () => random(400000, 600000)
      )

      asyncLoop(
        () => store.dispatch('updateFiatRates', { assets: Object.keys(state.fiatRates) }),
        () => random(40000, 60000)
      )

      break
  }
})
