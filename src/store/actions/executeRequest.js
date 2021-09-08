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
    if (request.method === 'chain.sendTransaction') {
      call = dispatch('sendTransaction', {
        network,
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
        if (fnName == 'estimateGas') {
          // 单独处理 chain.estimateGas 请求，转发到 client 里的 provider 方法
          methodFunc = client.getMethod('estimateGas').bind(client)
        } else {
          methodFunc = client[namespace][fnName].bind(client[namespace])
        }
      } else {
        methodFunc = client.getMethod(request.method).bind(client)
      }
      call = methodFunc(...request.args)
    }

    const { usbBridgeTransportCreated } = rootState.app
    if (account?.type.includes('ledger') && !usbBridgeTransportCreated) {
      dispatch('app/startBridgeListener').then((bridgeEmiter) => {
        bridgeEmiter.once('TRANSPORT_CREATED', () => {
          resolve(call)
        })
        dispatch('app/openUSBBridgeWindow')
      })
    } else {
      resolve(call)
    }
  })
  return result
}
