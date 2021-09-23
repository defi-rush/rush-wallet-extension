export const removeOwnerKey = async ({ state, commit, dispatch }, { publicKey }) => {
  commit('REMOVE_OWNER_KEY', { publicKey })
  // TODO 这里可能还要触发下其他的操作，比如对 proxyAddress 进行检查，是否 readonly 等
}
