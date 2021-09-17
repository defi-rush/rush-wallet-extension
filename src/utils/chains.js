import _ from 'lodash'
import { assets as originalAssets, chains as originalChains } from '@/liquality/cryptoassets'
import { CHAIN_RPC_MAPPING, CHAIN_ID_MAPPING } from '@/constants/chains'

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
    rpc: CHAIN_RPC_MAPPING[chainName],
    chainId: CHAIN_ID_MAPPING[chainName]
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
  safeConfirmations: 3,
  rpc: CHAIN_RPC_MAPPING['rush'],
  chainId: CHAIN_ID_MAPPING['rush']
}

export { assets, chains }
