import _ from 'lodash'
import { assets, chains as originalChains } from '@/liquality/cryptoassets'
import { CHAIN_RPC_MAPPING, CHAIN_ID_MAPPING } from '@/constants/chains'

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
    rpc: CHAIN_RPC_MAPPING[chainName],
    chainId: CHAIN_ID_MAPPING[chainName]
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
  rpc: CHAIN_RPC_MAPPING['localhost'],
  chainId: CHAIN_ID_MAPPING['localhost']
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
  rpc: CHAIN_RPC_MAPPING['rinkeby'],
  chainId: CHAIN_ID_MAPPING['rinkeby']
}

export { assets, chains }
