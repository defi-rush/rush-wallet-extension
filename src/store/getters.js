import { unitToCurrency } from '@/liquality/cryptoassets'
import { assets as cryptoassets } from '@/utils/chains'
import { createClient } from './factory/client'

import { Object } from 'core-js'
import BN from 'bignumber.js'
import { cryptoToFiat } from '@/utils/coinFormatter'
import { uniq, find, map } from 'lodash-es'

const clientCache = {}

export default {
  client (state, getters) {
    return ({
      network,
      asset,
      accountId,
      useCache = true,
      walletType = 'default',
      index = 0
    }) => {
      const account = accountId ? getters.accountItem(accountId) : null
      const accountType = account?.type || walletType
      const accountIndex = account?.index || index
      const { chainId = 1, proxyAddress, ownerPublicKey } = getters.activeProxyAddress || {}
      const cacheKey = [
        asset,
        proxyAddress,
        chainId
      ].join('-')

      if (useCache) {
        const cachedClient = clientCache[cacheKey]
        if (cachedClient) return cachedClient
      }

      // TODO 这里的 mnemonic 应该从 getters.activeProxyAddress 对应的 ownerKey 里拿
      // const { mnemonic } = state.wallets.find(w => w.id === walletId)
      const ownerKey = state.ownerKeys.find(i => i.publicKey === ownerPublicKey)
      const { mnemonic } = ownerKey
      const client = createClient(asset, network, mnemonic, accountType, accountIndex, proxyAddress, chainId)
      clientCache[cacheKey] = client

      return client
    }
  },
  historyItemById (state) {
    return (network, walletId, id) => state.history[network][walletId].find(i => i.id === id)
  },
  cryptoassets (state) {
    const { activeNetwork, activeWalletId } = state
    const baseAssets = cryptoassets
    const customAssets = state.customTokens[activeNetwork]?.[activeWalletId]?.reduce((assets, token) => {
      return Object.assign(assets, {
        [token.symbol]: {
          ...baseAssets.DAI, // Use DAI as template for custom tokens
          ...token,
          code: token.symbol
        }
      })
    }, {})

    return Object.assign({}, baseAssets, customAssets)
  },
  networkAccounts (state) {
    const { activeNetwork, activeWalletId, accounts } = state
    return accounts[activeWalletId]?.[activeNetwork] || []
  },
  networkAssets (state) {
    const { enabledAssets, activeNetwork, activeWalletId } = state
    return enabledAssets[activeNetwork][activeWalletId]
  },
  allNetworkAssets (state) {
    // return Networks.reduce((result, network) => {
    //   return uniq(result.concat(state.enabledAssets[network][state.activeWalletId]))
    // }, [])
    return uniq(map(state.proxyAddressAccount.assets, 'symbol'))
  },
  activity (state) {
    const { history, activeNetwork, activeWalletId } = state
    if (!history[activeNetwork]) return []
    if (!history[activeNetwork][activeWalletId]) return []
    return history[activeNetwork][activeWalletId].slice().reverse()
  },
  totalFiatBalance (_state, getters) {
    const { accountsData } = getters
    return accountsData
      .filter(a => a.type === 'default')
      .map(a => a.totalFiatBalance)
      .reduce((accum, balance) => {
        return accum.plus(BN(balance || 0))
      }, BN(0))
  },
  accountItem (state, getters) {
    const { accountsData } = getters
    return (accountId) => {
      const account = accountsData.find(a => a.id === accountId)
      return account
    }
  },
  accountsWithBalance (state, getters) {
    const { accountsData } = getters
    return accountsData.map(account => {
      const balances = Object.entries(account.balances)
        .filter(([_, balance]) => BN(balance).gt(0))
        .reduce((accum, [asset, balance]) => {
          return {
            ...accum,
            [asset]: balance
          }
        }, {})
      return {
        ...account,
        balances
      }
    }).filter(account => account.balances && Object.keys(account.balances).length > 0)
  },
  accountsData (state, getters) {
    const { accounts, activeNetwork, activeWalletId } = state
    const { accountFiatBalance, assetFiatBalance } = getters
    return accounts[activeWalletId]?.[activeNetwork]
      // TODO 暂时隐藏过滤的一步，因为 localhost network 还没有 assets
      .filter(account => account.assets && account.assets.length > 0)
      .map(account => {
        const totalFiatBalance = accountFiatBalance(activeWalletId, activeNetwork, account.id)
        const fiatBalances = Object.entries(account.balances)
          .reduce((accum, [asset, balance]) => {
            const fiat = assetFiatBalance(asset, balance)
            return {
              ...accum,
              [asset]: fiat
            }
          }, {})
        return {
          ...account,
          fiatBalances,
          totalFiatBalance
        }
      }).sort((a, b) => {
        return 0
      })
  },
  accountFiatBalance (state, getters) {
    const { accounts } = state
    const { assetFiatBalance } = getters
    return (walletId, network, accountId) => {
      const account = accounts[walletId]?.[network].find(a => a.id === accountId)
      if (account) {
        return Object.entries(account.balances)
          .reduce((accum, [asset, balance]) => {
            const fiat = assetFiatBalance(asset, balance)
            return accum.plus(fiat || 0)
          }, BN(0))
      }
      return BN(0)
    }
  },
  assetFiatBalance (state) {
    const { fiatRates } = state
    return (asset, balance) => {
      if (fiatRates && fiatRates[asset] && balance) {
        const amount = unitToCurrency(cryptoassets[asset], balance)
        return cryptoToFiat(amount, fiatRates[asset])
      }
      return null
    }
  },
  analyticsEnabled (state) {
    if (state.analytics && state.analytics.acceptedDate != null) {
      return true
    }
    return false
  },
  activeProxyAddress (state) {
    const { activeProxyAddressIndex, proxyAddresses } = state
    const currProxyAddress = activeProxyAddressIndex >= 0 && proxyAddresses.length > 0 ? proxyAddresses[activeProxyAddressIndex] : null
    return currProxyAddress || null
  },
  activeOwnerKey(state, getters) {
    if (!getters.activeProxyAddress) return null
    const { ownerPublicKey } = getters.activeProxyAddress
    return find(state.ownerKeys, { publicKey: ownerPublicKey })
  },
  activeWallet (state, getters) {
    if (!getters.activeProxyAddress) return null
    const { walletId } = getters.activeProxyAddress
    if (!walletId) return null
    const wallet = find(state.wallets, { id: walletId })
    return wallet
  },
  proxyAddressAccountFiatBalances(state) {
    const result = {
      fiatBalances: {},
      totalFiatBalance: BN(0)
    }
    const { assets, balances } = state.proxyAddressAccount || {}
    const { fiatRates } = state
    _.forEach(balances, (balance, symbol) => {
      const asset = _.find(assets, { symbol })
      if (asset && fiatRates && fiatRates[asset.symbol] && balance) {
        const fiatBalance = cryptoToFiat(unitToCurrency(asset, balance), fiatRates[asset.symbol])
        result.fiatBalances[symbol] = fiatBalance
        result.totalFiatBalance = result.totalFiatBalance.plus(fiatBalance || 0)
      }
    })
    return result
  }
}
