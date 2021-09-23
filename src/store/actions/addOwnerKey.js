import { ethers } from 'ethers'

export const addOwnerKey = async ({ state, commit }, { mnemonic, ownerKeyName = '' }) => {
  // 这里多加一步，输入助记词之后需要再加入 proxyAddress，然后和wallet 一起encrypt
  const existed = state.ownerKeys.find(w => w.mnemonic === mnemonic)
  if (existed) {
    throw new Error('mnemonic is existing')
  } else {
    // 如果不存在已匹配的 wallet，则继续之前的流程创建 wallet 以及 account
    const name = ownerKeyName || 'OwnerKey ' + ((state.ownerKeys || []).length + 1)
    const _wallet = ethers.Wallet.fromMnemonic(mnemonic)
    const publicKey = await _wallet.getAddress()
    const ownerKey = { name, mnemonic, publicKey }
    commit('ADD_OWNER_KEY', { ownerKey })
    return publicKey
  }
}
