import _ from 'lodash'
import buildConfig from '../../build.config'
import { CHAIN_ID_MAPPING } from '@/constants/chains'

const TOKEN_LIST = require('@/constants/_tokens.json')
const LOCALHOST_CHAIN_IDS = [31337, 71337]
const ETHERUM_TEST_CHAIN_IDS = [3]

const nativeTokenMapping = {
  eth: 1,
  rinkeby: 3,
  bnb: 56,
  matic: 137
}
/**
 * 
 * 检测当前 chainId， 更新 assets 以及 assetBalances
 */
export const updateProxyAddressAccountAssets = async ({ getters, commit }) => {
  const { activeProxyAddress } = getters
  let chainId = activeProxyAddress.chainId
  if (!chainId || LOCALHOST_CHAIN_IDS.indexOf(chainId) >= 0 || ETHERUM_TEST_CHAIN_IDS.indexOf(chainId) >= 0) {
    chainId = 1
  }
  const { defaultAssets } = buildConfig
  const assets = []

  _.forEach(defaultAssets, assetSymbol => {
    const token = _.find(TOKEN_LIST, ({ symbol }) => symbol.toUpperCase() === assetSymbol.toUpperCase())
    if (token) {
      let asset
      if (nativeTokenMapping[token.symbol.toLowerCase()] === chainId) {
        // is native token
        asset = {
          ...token,
          symbol: token.symbol.toUpperCase(),
          coinGeckoId: token.coingeckoId,
          type: 'native'
        }
      } else if (token.contract[chainId]) {
        // erc20
        asset = {
          ...token,
          coinGeckoId: token.coingeckoId,
          type: 'erc20',
          contractAddress: token.contract[chainId].address,
          decimals: token.contract[chainId].decimals,
          symbol: token.contract[chainId].symbol
        }

      }
      if (asset) assets.push(asset)
    }
  })
  commit('UPDATE_PROXY_ADDRESS_ACCOUNT_ASSETS', assets)
}
