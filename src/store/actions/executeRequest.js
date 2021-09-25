import { assets } from '@/utils/chains'

export const executeRequest = async ({ getters, dispatch, state, rootState }, { request }) => {
  // Send transactions through wallet managed action
  const { network, walletId, asset, origin } = request
  const { accountItem } = getters
  const { externalConnections, activeWalletId } = state
  const chain = assets[asset].chain
  const accountList = { ...externalConnections }[activeWalletId]?.[origin]?.[chain] || []
  const [accountId] = accountList
  const account = accountItem(accountId)
  let call
  const result = await new Promise((resolve, reject) => {
    if (request.method === 'chain.sendProxyTransaction') {
      call = dispatch('sendProxyTransaction', {
        network: 'mainnet',
        walletId,
        asset,
        to: request.args[0].to,
        amount: request.args[0].value,
        data: request.args[0].data,
        fee: request.args[0].fee,
        gas: request.args[0].gas,
        accountId
      })
    } else {
      // Otherwise build client
      const client = getters.client(
        {
          network,
          walletId,
          asset,
          accountId
        }
      )
      let methodFunc
      if (request.method.includes('.')) {
        const [namespace, fnName] = request.method.split('.')
        if (fnName === 'estimateProxyGas') {
          // 单独处理 chain.estimateProxyGas 请求，转发到 client 里的 provider 方法
          methodFunc = client.getMethod('estimateProxyGas').bind(client)
        } else if (fnName === 'getProxyAddresses') {
          // 这里直接调用 RushJsWalletProvider.getProxyAddresses 返回 proxyAddress
          methodFunc = client.getMethod('getProxyAddresses').bind(client)
        } else {
          methodFunc = client[namespace][fnName].bind(client[namespace])
        }
      } else {
        methodFunc = client.getMethod(request.method).bind(client)
      }
      call = methodFunc(...request.args)
    }
    resolve(call)
  })
  return result
}
