
export default {
  defaultAssets: [
    'ETH',
    'WETH',
    'DAI',
    'USDC',
    'USDT',
    'WBTC',
    'UNI',
    'BNB',
    'MATIC'
  ],
  infuraApiKey: 'da99ebc8c0964bb8bb757b6f8cc40f1f',
  exploraApis: {
    testnet: 'https://liquality.io/testnet/electrs',
    mainnet: 'https://api-mainnet-bitcoin-electrs.liquality.io'
  },
  batchEsploraApis: {
    testnet: 'https://liquality.io/electrs-testnet-batch',
    mainnet: 'https://api-mainnet-bitcoin-electrs-batch.liquality.io'
  },
  discordUrl: 'https://discord.gg/Xsqw7PW8wk',
  networks: ['mainnet'],
  chains: ['rush']
}
