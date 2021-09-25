import { v4 as uuidv4 } from 'uuid'
import { encrypt } from '../../utils/crypto'
import buildConfig from '../../build.config'
import { accountCreator, getNextAccountColor } from '@/utils/accounts'
// import { assets as cryptoassets } from '@/utils/chains'
import { chains } from '@/utils/chains'
import { shouldApplyRskLegacyDerivation } from '../utils'

export const createWallet = async ({ state, commit, dispatch }, { key, mnemonic, proxyAddress, chainId }) => {
  // 这里多加一步，输入助记词之后需要再加入 proxyAddress，然后和wallet 一起encrypt
  let id = uuidv4()
  let wallet
  let ownerPublicKey
  const existed = state.wallets.find(w => w.mnemonic === mnemonic)
  if (existed) {
    id = existed.id
  } else {
    // 如果不存在已匹配的 wallet，则继续之前的流程创建 wallet 以及 account
    const at = Date.now()
    const name = 'Account ' + ((state.wallets || []).length + 1)
    wallet = { id, name, mnemonic, at, imported: false, proxyAddress }
    const { encrypted: encryptedWallets, keySalt } = await encrypt(
      JSON.stringify([wallet]),
      key
    )
    // TODO to remove rsk sometime
    ownerPublicKey = await dispatch('addOwnerKey', { mnemonic })
    const rskLegacyDerivation = await shouldApplyRskLegacyDerivation(state.accounts, mnemonic)
    commit('CREATE_WALLET', { keySalt, encryptedWallets, wallet, rskLegacyDerivation })
    // commit('CREATE_ACCOUNT', { network, walletId: id, account: _account })
  }
  if (!state.activeWalletId) {
    // 如果是初始化钱包的时候，activeWalletId 是空的，则 CHANGE_ACTIVE_WALLETID
    commit('CHANGE_ACTIVE_WALLETID', { walletId: id })
  }

  commit('ADD_PROXY_ADDRESS', { proxyAddress, chainId, walletId: id, ownerPublicKey })
  if (+state.activeProxyAddressIndex < 0) {
    // activeProxyAddressIndex 是空的，则 SET_ACTIVE_PROXY_ADDRESS_INDEX
    dispatch('changeActiveProxyAddressIndex', { index: 0 })
  }
  dispatch('updateProxyAddressAccountAssets')
  dispatch('updateProxyAddressAccountBalances', { useCache: false })

  return wallet
}
