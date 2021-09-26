export const changeActiveProxyAddressIndex = async ({ state, commit, dispatch, getters }, { index }) => {
  const { chainId: originalChainId, proxyAddress: originalProxyAddress } = getters.activeProxyAddress || {}
  commit('SET_ACTIVE_PROXY_ADDRESS_INDEX', index)
  const { chainId, proxyAddress } = getters.activeProxyAddress || {}
  if (chainId !== originalChainId) {
    commit('CHANGE_ACTIVE_CHAIN_ID', chainId)
  }
  if (proxyAddress !== originalProxyAddress) {
    commit('CHANGE_ACTIVE_PROXY_ADDRESS_ACCOUNT', proxyAddress)
  }
}
