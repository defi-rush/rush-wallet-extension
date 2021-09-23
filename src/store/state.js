// addresses.network.walletId.asset
// balances.network.walletId.asset
// history.network.walletId[]
// marketData.network
import { LATEST_VERSION } from './migrations'

export default {
  version: LATEST_VERSION,

  // <do not keep these in localStorage>
  key: null,
  wallets: [],
  ownerKeys: [],
  unlockedAt: null,
  // </do not keep these in localStorage>

  pendingChainId: null,     // 用于在创建wallet的中途记录 chainId
  pendingProxyAddress: '',  // 用于在创建wallet的中途记录 proxyAddress
  proxyAddresses: [],
  activeProxyAddressIndex: -1,

  brokerReady: true,

  encryptedWallets: null,

  enabledAssets: {},
  customTokens: {},

  accounts: {},

  fiatRates: {},
  fees: {},
  history: {},
  marketData: {},

  activeNetwork: 'mainnet',
  activeWalletId: null,
  activeAsset: null,

  keyUpdatedAt: null,
  keySalt: null,
  termsAcceptedAt: null,
  setupAt: null,

  injectEthereum: false,
  injectEthereumChain: 'ethereum',
  usbBridgeWindowsId: 0,

  externalConnections: {},
  rskLegacyDerivation: false,
  analytics: {
    userId: null,
    acceptedDate: null,
    askedDate: null,
    askedTimes: 0,
    notAskAgain: false
  },
  watsNewModalVersion: null,
  loadingBalances: false
}
