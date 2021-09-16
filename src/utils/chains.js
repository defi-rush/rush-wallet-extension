import _ from 'lodash'
import { assets as originalAssets, chains } from '@/liquality/cryptoassets'
import { chain_rpc_mapping, chain_id_mapping } from '@/constants/chains'

const assets = {}
for (const key in originalAssets) {
  const assetData = originalAssets[key]
  assets[key] = { ...assetData }
  if (assetData.chain === 'ethereum') {
    assets[key].chain = 'rush'
  }
}

chains['rush'] = {
  ...chains['ethereum'],
  name: 'rush',
  code: 'ETH',  // TODO 这个有啥用，貌似是symbol
  nativeAsset: 'ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3
}

const availableChains =  _.chain(chains)
                          .pick(['ethereum', 'bsc', 'polygon', 'rush'])
                          .map((obj, chainName) => {
                            return {
                              ...obj,
                              rpc: chain_rpc_mapping[chainName],
                              chainId: chain_id_mapping[chainName]
                            }
                          })
                          .value()

export { assets, availableChains as chains }
