import { v4 as uuidv4 } from 'uuid'
import { encrypt } from '../../utils/crypto'
import buildConfig from '../../build.config'
import { accountCreator, getNextAccountColor } from '@/utils/accounts'
import { assets as cryptoassets } from '@/utils/chains'
import { chains } from '@/utils/chains'
import { shouldApplyRskLegacyDerivation } from '../utils'

export const createWallet = async ({ state, commit, dispatch }, { key, mnemonic, proxyAddress, chainId = 1 }) => {
  // 这里多加一步，输入助记词之后需要再加入 proxyAddress，然后和wallet 一起encrypt
  const id = uuidv4()
  const at = Date.now()
  const name = 'Account ' + (state.wallets.length + 1)
  const wallet = { id, name, mnemonic, at, imported: false, proxyAddress, chainId }
  const { networks, defaultAssets } = buildConfig
  const { encrypted: encryptedWallets, keySalt } = await encrypt(
    JSON.stringify([wallet]),
    key
  )
  // TODO to remove rsk sometime
  const rskLegacyDerivation = await shouldApplyRskLegacyDerivation(state.accounts, mnemonic)

  console.log('CREATE_WALLET.wallet', wallet)
  commit('CREATE_WALLET', { keySalt, encryptedWallets, wallet, rskLegacyDerivation })
  if (!state.activeWalletId) {
    // 如果是初始化钱包的时候，activeWalletId 是空的，则 CHANGE_ACTIVE_WALLETID
    commit('CHANGE_ACTIVE_WALLETID', { walletId: id })
  }
  commit('ENABLE_ASSETS', { network: 'mainnet', walletId: id, assets: defaultAssets.mainnet })
  commit('ENABLE_ASSETS', { network: 'testnet', walletId: id, assets: defaultAssets.testnet })

  commit('ADD_PROXY_ADDRESS', { proxyAddress, chainId, walletId: id })
  if (+state.activeProxyAddressIndex < 0) {
    // activeProxyAddressIndex 是空的，则 SET_ACTIVE_PROXY_ADDRESS_INDEX
    commit('SET_ACTIVE_PROXY_ADDRESS_INDEX', 0)
  }

  networks.forEach(network => {
    const assetKeys = defaultAssets[network]
    buildConfig.chains.forEach(async chainName => {
      const assets = assetKeys.filter(asset => {
        return cryptoassets[asset]?.chain === chainName
      })

      const chain = chains[chainName]
      const _account = accountCreator(
        {
          walletId: id,
          account: {
            name: `${chain.name} 1`,
            chain: chainName,
            addresses: [],
            assets,
            balances: {},
            type: 'default',
            index: 0,
            color: getNextAccountColor(chainName, 0)
          }
        })
      commit('CREATE_ACCOUNT', { network, walletId: id, account: _account })
    })
  })

  return wallet
}
