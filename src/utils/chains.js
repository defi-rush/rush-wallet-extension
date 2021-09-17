import _ from 'lodash'
import { assets as originalAssets, chains as originalChains } from '@/liquality/cryptoassets'
import { chain_rpc_mapping, chain_id_mapping } from '@/constants/chains'

const assets = {}
for (const key in originalAssets) {
  const assetData = originalAssets[key]
  assets[key] = { ...assetData }
  if (assetData.chain === 'ethereum') {
    assets[key].chain = 'rush'
  }
}

const chains = {}
_.forEach(['ethereum', 'bsc', 'polygon'], chainName => {
  chains[chainName] = {
    ...originalChains[chainName],
    rpc: chain_rpc_mapping[chainName],
    chainId: chain_id_mapping[chainName]
  }
})

chains['rush'] = {
  ...chains['ethereum'],
  name: 'rush',
  code: 'ETH',
  nativeAsset: 'ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3
}

export { assets, chains }
