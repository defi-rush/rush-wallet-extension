import { assets, chains } from '@liquality/cryptoassets'

/**
 * override chains
 */

// const whiteList = [
//   'ethereum', 'bsc', 'polygon'
// ]
// const chains = {}
// whiteList.forEach((name) => {
//   chains[name] = originalChains[name]
// })

chains['localhost'] = {
  ...chains['ethereum'],
  name: 'Localhost',
  code: 'ETH',  // TODO 这个有啥用，待定
  nativeAsset: 'LOCAL_ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3
}

chains['rush'] = {
  ...chains['ethereum'],
  name: 'rush',
  code: 'ETH',  // TODO 这个有啥用，待定
  nativeAsset: 'RUSH_ETH',
  fees: {
    unit: 'gwei'
  },
  safeConfirmations: 3
}

assets['LOCAL_ETH'] = {
  ...assets['ETH'],
  chain: 'localhost',
  matchingAsset: 'ETH'
}
assets['RUSH_ETH'] = {
  ...assets['ETH'],
  chain: 'rush',
  matchingAsset: 'ETH'
}

export { assets, chains }
