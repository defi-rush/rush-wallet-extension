import { assets, chains as originalChains } from '@liquality/cryptoassets'

/**
 * override chains
 */

const whiteList = [
  'ethereum', 'bsc', 'polygon'
]
const chains = {}
whiteList.forEach((name) => {
  chains[name] = originalChains[name]
})

chains['localhost'] = {
  ...originalChains['ethereum'],
  name: 'Localhost',
  code: 'ETH',  // TODO 这个有啥用，待定
  nativeAsset: 'LOCAL_ETH',
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

export { assets, chains }
