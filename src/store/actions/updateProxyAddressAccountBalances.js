import _ from 'lodash'
import Bluebird from 'bluebird'
import { unitToCurrency } from '@/liquality/cryptoassets'
import { cryptoToFiat } from '@/utils/coinFormatter'

const getAssetFiatBalance = ({ fiatRates, asset, balance }) => {
  if (fiatRates && fiatRates[asset.symbol] && balance) {
    const amount = unitToCurrency(asset, balance)
    return cryptoToFiat(amount, fiatRates[asset])
  }
  return null
}

/**
 * 
 * 检测当前 chainId， 更新 assets 以及 assetBalances
 */
export const updateProxyAddressAccountBalances = async ({ state, getters, commit }, { useCache = true } = {}) => {
  const { client } = getters
  commit('START_UPDATING_BALANCE')

  await Bluebird.map(state.proxyAddressAccount.assets, async (asset) => {
    if (!asset) return
    const _client = await client(
      {
        network: 'mainnet',
        asset,
        useCache
      }
    )

    const getProxyAddresses = _client.getMethod('getProxyAddresses').bind(_client)
    let addresses = await getProxyAddresses()
    const balance = addresses.length === 0
      ? 0
      : (await client(
        {
          network: 'mainnet',
          asset,
          useCache
        }
      ).chain.getBalance(addresses)).toNumber()
    console.log('@@@ updateProxyAddressAccountBalances', asset.symbol, { asset, balance })
    commit('UPDATE_PROXY_ADDRESS_ACCOUNT_ASSET_BALANCE', { symbol: asset.symbol, balance })

  }, { concurrency: 1 })
  commit('COMPLETE_UPDATING_BALANCE')
}
