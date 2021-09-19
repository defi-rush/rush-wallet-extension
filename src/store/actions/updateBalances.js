import Bluebird from 'bluebird'

export const updateBalances = async ({ state, commit, getters }, { network, walletId, assets, useCache = true }) => {
  let accounts = state.accounts[walletId]?.[network]
    .filter(a => a.assets && a.assets.length > 0)
  if (assets && assets.length > 0) {
    accounts = accounts.filter(a => a.assets.some(s => assets.includes(s)))
  }
  const { client } = getters
  commit('START_UPDATING_BALANCE')
  await Bluebird.map(accounts, async account => {
    const { assets, type } = account
    await Bluebird.map(assets, async asset => {
      const _client = await client(
        {
          network,
          walletId,
          asset,
          accountId: account.id,
          useCache
        }
      )

      const getProxyAddresses = _client.getMethod('getProxyAddresses').bind(_client)
      let addresses = await getProxyAddresses()
      const balance = addresses.length === 0
        ? 0
        : (await client(
          {
            network,
            walletId,
            asset,
            accountId: account.id,
            useCache
          }
        ).chain.getBalance(addresses)).toNumber()
      commit('UPDATE_BALANCE', { network, accountId: account.id, walletId, asset, balance })

      // Commit to the state the addresses
      let updatedAddresses = [...addresses.map(a => a.address)]

      commit('UPDATE_ACCOUNT_ADDRESSES',
        {
          network,
          accountId: account.id,
          walletId,
          asset,
          addresses: updatedAddresses
        })
    }, { concurrency: 1 })
  }, { concurrency: 1 })
  commit('COMPLETE_UPDATING_BALANCE')
}
