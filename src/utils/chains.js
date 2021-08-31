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
  name: 'Localhost:8545'
}

assets['LOCAL_ETH'] = {
  ...assets['ETH'],
  chain: 'localhost'
}

export { assets, chains }
