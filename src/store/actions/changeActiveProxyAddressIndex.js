export const changeActiveProxyAddressIndex = async ({ state, commit, dispatch, getters }, { index }) => {
  commit('SET_ACTIVE_PROXY_ADDRESS_INDEX', index)
}
