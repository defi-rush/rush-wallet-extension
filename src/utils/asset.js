import {
  chains,
  isEthereumChain as _isEthereumChain
} from '@/liquality/cryptoassets'
import cryptoassets from '@/utils/cryptoassets'
import * as ethers from 'ethers'
import tokenABI from './tokenABI.json'
import buildConfig from '../build.config'

const EXPLORERS = {
  ethereum: {
    tx: 'https://etherscan.io/tx/0x',
    address: 'https://etherscan.io/address/'
  },
  bsc: {
    tx: 'https://bscscan.com/tx/',
    address: 'https://bscscan.com/address/'
  },
  polygon: {
    tx: 'https://polygonscan.com/tx/0x',
    address: 'https://polygonscan.com/address/'
  },
  localhost: {
    tx: 'https://etherscan.io/tx/0x',
    address: 'https://etherscan.io/address/'
  },
}

export const isERC20 = asset => {
  return cryptoassets[asset]?.type === 'erc20'
}

export const isEthereumChain = asset => {
  const chain = cryptoassets[asset]?.chain
  return _isEthereumChain(chain)
}

export const isEthereumNativeAsset = asset => {
  const chainId = cryptoassets[asset]?.chain
  if (
    chainId &&
    _isEthereumChain(chainId) &&
    chains[chainId].nativeAsset === asset
  ) {
    return true
  }

  return false
}

export const getNativeAsset = asset => {
  const chainId = cryptoassets[asset]?.chain
  return chainId ? chains[chainId].nativeAsset : asset
}

export const getAssetColorStyle = asset => {
  const assetData = cryptoassets[asset]
  if (assetData && assetData.color) {
    return { color: assetData.color }
  }
  // return black as default
  return { color: '#000000' }
}

export const getTransactionExplorerLink = (hash, asset) => {
  const transactionHash = getExplorerTransactionHash(asset, hash)
  const chain = cryptoassets[asset].chain
  return `${EXPLORERS[chain].tx}${transactionHash}`
}

export const getAddressExplorerLink = (address, asset) => {
  const chain = cryptoassets[asset].chain
  return `${EXPLORERS[chain].address}${address}`
}

export const getAssetIcon = (asset, extension = 'svg') => {
  try {
    return require(`../assets/icons/assets/${asset.toLowerCase()}.${extension}?inline`)
  } catch (e) {
    try {
      return require(`../../node_modules/cryptocurrency-icons/svg/color/${asset.toLowerCase()}.svg?inline`)
    } catch (e) {
      return require('../assets/icons/blank_asset.svg?inline')
    }
  }
}

export const getExplorerTransactionHash = (asset, hash) => {
  switch (asset) {
    case 'NEAR':
      return hash.split('_')[0]
    default:
      return hash
  }
}

export const tokenDetailProviders = {
  ethereum: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, `https://mainnet.infura.io/v3/${buildConfig.infuraApiKey}`)
    }
  },
  localhost: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, `https://mainnet.infura.io/v3/${buildConfig.infuraApiKey}`)
    }
  },
  rush: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, `https://mainnet.infura.io/v3/${buildConfig.infuraApiKey}`)
    }
  },
  polygon: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, 'https://rpc-mainnet.matic.network/')
    }
  },
  rsk: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, 'https://public-node.rsk.co')
    }
  },
  bsc: {
    async getDetails (contractAddress) {
      return await fetchTokenDetails(contractAddress, 'https://bsc-dataseed.binance.org')
    }
  }
}

const fetchTokenDetails = async (contractAddress, rpcUrl) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress.toLowerCase(), tokenABI, provider)

  const [decimals, name, symbol] = await Promise.all([
    contract.decimals(),
    contract.name(),
    contract.symbol()
  ])

  return { decimals, name, symbol }
}
