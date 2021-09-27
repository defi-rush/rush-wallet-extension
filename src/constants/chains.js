
export const CHAIN_RPC_MAPPING = {
  'ethereum': 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'rinkeby': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'bsc': 'https://bsc-dataseed.binance.org',
  'polygon': 'https://rpc-mainnet.maticvigil.com',
  'localhost': 'http://localhost:8545'
}

export const CHAIN_ID_MAPPING = {
  'ethereum': 1,
  'rinkeby': 4,
  'bsc': 56,
  'polygon': 137,
  'localhost': 31337
}
export const CHAIN_NATIVE_ASSET_MAPPING = {
  '1': 'ETH',
  '4': 'ETH',
  '56': 'BNB',
  '137': 'MATIC',
  '31337': 'ETH'
}

export const CHAIN_ID_RPC_MAPPING = {
  '1': 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  '4': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  '56': 'https://bsc-dataseed.binance.org',
  '137': 'https://rpc-mainnet.maticvigil.com',
  '31337': 'http://localhost:8545'
}



export const CHAINS = [{
  chainId: 1,
  chainName: 'Ethereum',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
}, {
  chainId: 137,
  chainName: 'Polygon POS',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrl: 'https://rpc-mainnet.maticvigil.com'
}, {
  chainId: 56,
  chainName: 'Binance Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrl: 'https://bsc-dataseed.binance.org'
}, {
  chainId: 128,
  chainName: 'Huobi ECO Chain',
  nativeCurrency: {
    name: 'HT',
    symbol: 'HT',
    decimals: 18
  },
  rpcUrl: 'https://http-mainnet-node.huobichain.com'
}, {
  chainId: 4,
  chainName: 'Rinkeby Test Network',
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
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrl: 'http://localhost:8545',
}]
