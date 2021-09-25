import { createRuchClient } from './RushClient'

export const createClient = (asset, network, mnemonic, walletType, indexPath = 0, proxyAddress, chainId) => {
  return createRuchClient({ asset, mnemonic, indexPath, proxyAddress, chainId })
}
