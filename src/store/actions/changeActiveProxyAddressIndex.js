import { random } from 'lodash-es'
import { wait } from '@/store/utils'

function asyncLoop (fn, delay) {
  return wait(delay())
    .then(() => fn())
    .then(() => asyncLoop(fn, delay))
}

export const changeActiveProxyAddressIndex = async ({ state, commit, dispatch, getters }, { index }) => {
  commit('SET_ACTIVE_PROXY_ADDRESS_INDEX', index)
  const { activeWallet, activeProxyAddress, activeChain } = getters
  // console.log('@@@ after change activeProxyAddress', { activeWallet, activeProxyAddress, activeChain })
  const { activeWalletId } = state
  if (activeWalletId !== activeWallet.id) {
    // activeWallet.id (由 activeProxyAddress 计算得来) 不和当前 state.activeWalletId 相同，则修改 activeWalletId
    dispatch('changeActiveWalletId', { walletId: activeWallet.id })
  }

  dispatch('initializeAddresses', { network: state.activeNetwork, walletId: state.activeWalletId })
  dispatch('updateBalances', { network: state.activeNetwork, walletId: state.activeWalletId, useCache: false })
}
