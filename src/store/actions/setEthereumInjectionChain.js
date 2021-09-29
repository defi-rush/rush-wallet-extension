export const setEthereumInjectionChain = async ({ commit }, { chain }) => {
  commit('CHANGE_ETHEREUM_INJECTION_CHAIN', { chain })
}
