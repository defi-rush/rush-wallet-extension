
export const getOwners = async ({ state, commit, getters }, { useCache = false } = {}) => {
  const { client } = getters
  commit('START_GETTING_OWNERS')
  try {
    const _client = await client({
      network: 'mainnet',
      useCache
    })
    const getOwners = _client.getMethod('getOwners').bind(_client)
    const [owners] = await getOwners()
    commit('SET_OWNERS', owners)
  } catch (error) {
    console.log('getOwners failed', JSON.stringify(error))
  }
  commit('FINISH_GETTING_OWNERS')
}
