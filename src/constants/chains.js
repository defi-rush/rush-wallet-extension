import { find } from 'lodash-es'

export const CHAINS = [{
  chainId: 1,
  chainName: 'Ethereum',
  aliasChainName: 'ethereum',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
}, {
  chainId: 137,
  chainName: 'Polygon POS',
  aliasChainName: 'polygon',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrl: 'https://rpc-mainnet.maticvigil.com'
}, {
  chainId: 56,
  chainName: 'Binance Smart Chain',
  aliasChainName: 'bsc',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrl: 'https://bsc-dataseed.binance.org'
}, {
  chainId: 128,
  chainName: 'Huobi ECO Chain',
  aliasChainName: 'hero',
  nativeCurrency: {
    name: 'HT',
    symbol: 'HT',
    decimals: 18
  },
  rpcUrl: 'https://http-mainnet-node.huobichain.com'
}, {
  chainId: 4,
  chainName: 'Rinkeby Test Network',
  aliasChainName: 'rinkeby',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
}, {
  forking: true,
  chainId: 71337,
  chainName: 'hardhat-dev.defirush.io',
  aliasChainName: 'hardhat-dev.defirush.io',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'https://hardhat-dev.defirush.io',
}, {
  forking: true,
  chainId: 31337,
  chainName: 'localhost',
  aliasChainName: 'localhost',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'http://localhost:8545',
}]

export const getChain = ({ chainName, chainId }) => {
  let chainObj
  if (chainName) {
    chainName = chainName.toLowerCase()
    chainObj = find(CHAINS, item => {
      return chainName === item.chainName.toLowerCase() || chainName === item.aliasChainName.toLowerCase()
    })
  } else if (+chainId) {
    chainObj = find(CHAINS, item => {
      return +chainId === +item.chainId
    })
  }

  return chainObj
}

export const getRpcUrl = ({ chainName, chainId }) => {
  const chainObj = getChain({ chainName, chainId })
  return chainObj ? chainObj.rpcUrl : ''
}

export const getChainId = ({ chainName = '' }) => {
  if (!chainName) return null
  chainName = chainName.toLowerCase()
  const chainObj = find(CHAINS, item => {
    return chainName === item.chainName.toLowerCase() || chainName === item.aliasChainName.toLowerCase()
  })
  return chainObj ? chainObj.chainId : null
}

export const getNativeAssetSymbol = ({ chainName, chainId }) => {
  const chainObj = getChain({ chainName, chainId })
  return chainObj && chainObj.nativeCurrency ? chainObj.nativeCurrency.symbol : null
}