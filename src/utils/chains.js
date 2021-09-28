import _ from 'lodash'
import { assets, chains as originalChains } from '@/liquality/cryptoassets'
import { getRpcUrl, getChainId } from '@/constants/chains'

// const assets = {}
// for (const key in originalAssets) {
//   const assetData = originalAssets[key]
//   assets[key] = { ...assetData }
//   if (assetData.chain === 'ethereum') {
//     assets[key].chain = 'rush'
//   }
// }

const chains = {}
_.forEach(['ethereum', 'bsc', 'polygon'], chainName => {
  chains[chainName] = {
    ...originalChains[chainName],
    rpc: getRpcUrl({ chainName: chainName }),
    chainId: getChainId({ chainName: chainName })
  }
})

chains['localhost'] = {
  ...chains['ethereum'],
  name: 'localhost',
  code: 'ETH',
  nativeAsset: 'ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3,
  rpc: getRpcUrl({ chainName: 'localhost' }),
  chainId: getChainId({ chainName: 'localhost' })
}

chains['rinkeby'] = {
  ...chains['ethereum'],
  name: 'rinkeby',
  code: 'ETH',
  nativeAsset: 'ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3,
  rpc: getRpcUrl({ chainName: 'rinkeby' }),
  chainId: getChainId({ chainName: 'rinkeby' })
}

export { assets, chains }
