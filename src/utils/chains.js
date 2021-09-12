import _ from 'lodash'
import { assets as originalAssets, chains } from '@/liquality/cryptoassets'

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

export { assets, chains }
