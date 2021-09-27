const providerManager = () => `
class InjectedProvider {
  constructor (asset) {
    this.asset = asset
  }

  setClient () {}

  getMethod (method) {
    return (...args) => window.providerManager.proxy('CAL_REQUEST', {
      asset: this.asset,
      method,
      args
    })
  }
}

class ProviderManager {
  constructor () {
    this.cache = {}
  }

  proxy (type, data) {
    return new Promise((resolve, reject) => {
      const id = Date.now() + '.' + Math.random()

      window.addEventListener(id, ({ detail }) => {
        const response = JSON.parse(detail)
        if (response.error) reject(new Error(response.error))
        else resolve(response.result)
      }, {
        once: true,
        passive: true
      })

      window.postMessage({
        id,
        type,
        data
      }, '*')
    })
  }

  getProviderFor (asset) {
    if (this.cache[asset]) return this.cache[asset]

    this.cache[asset] = new InjectedProvider(asset)

    return this.cache[asset]
  }

  getInjectionName (chain) {
    return chain === 'ethereum' ? 'eth' : chain
  }

  enable (chain) {
    return this.proxy('ENABLE_REQUEST', { chain })
  }
}

window.providerManager = new ProviderManager()
`

const ethereumProvider = ({ asset, chain, network }) => `
const injectionName = window.providerManager.getInjectionName('${chain}')

async function getAddresses () {
  const eth = window.providerManager.getProviderFor('${asset}')
  let addresses = await eth.getMethod('wallet.getProxyAddresses')()
  addresses = addresses.map(a => '0x' + a.address)
  window[injectionName].selectedAddress = addresses[0]
  return addresses
}

async function handleRequest (req) {
  const eth = window.providerManager.getProviderFor('${asset}')
  if(req.method.startsWith('metamask_')) return null

  if(req.method === 'eth_requestAccounts') {
    return await window[injectionName].enable()
  }
  if(req.method === 'personal_sign') {
    const sig = await eth.getMethod('wallet.signMessage')(req.params[0], req.params[1])
    return '0x' + sig
  }
  if(req.method === 'eth_sendTransaction') {
    const to = req.params[0].to
    const value = req.params[0].value
    const data = req.params[0].data
    const gas = req.params[0].gas
    const result = await eth.getMethod('chain.sendProxyTransaction')({ to, value, data, gas })
    return '0x' + result.hash
  }
  if(req.method === 'eth_accounts') {
    return getAddresses()
  }
  if(req.method === 'eth_estimateGas') {
    const to = req.params[0].to
    const value = req.params[0].value
    const data = req.params[0].data
    return await eth.getMethod('chain.estimateProxyGas')({ to, value, data })
  }
  const method = eth.getMethod('jsonrpc')
  return method(req.method, ...req.params)
}


window[injectionName] = {
  isLiquality: true,
  isEIP1193: true,
  networkVersion: '${network.networkId}',
  chainId: '0x${network.chainId.toString(16)}',
  enable: async () => {
    const accepted = await window.providerManager.enable('${chain}')
    if (!accepted) throw new Error('User rejected')
    return getAddresses()
  },
  request: async (req) => {
    const params = req.params || []
    return handleRequest({
      method: req.method, params
    })
  },
  send: async (req, _paramsOrCallback) => {
    if (typeof _paramsOrCallback === 'function') {
      window[injectionName].sendAsync(req, _paramsOrCallback)
      return
    }
    const method = typeof req === 'string' ? req : req.method
    const params = req.params || _paramsOrCallback || []
    return handleRequest({ method, params })
  },
  sendAsync: (req, callback) => {
    handleRequest(req)
      .then((result) => callback(null, {
        id: req.id,
        jsonrpc: '2.0',
        result
      }))
      .catch((err) => callback(err))
  },
  on: (method, callback) => {
    if (method === 'chainChanged') {
      window.addEventListener('rushActiveChainIdChanged', ({ detail }) => {
        const result = JSON.parse(detail)
        callback('0x' + result.chainIds[0].toString(16))
      })
    }

    if (method === 'accountsChanged') {
      window.addEventListener('rushActiveProxyAddressAccountChanged', ({ detail }) => {
        const result = JSON.parse(detail)
        callback('0x' + result.accounts[0].toString(16))
      })
    }
  },
  autoRefreshOnNetworkChange: false
}
`

const overrideEthereum = (chain) => `
function proxyEthereum(chain) {
  window.ethereumProxyChain = chain
  const overrideHandler = {
    get: function (target, prop, receiver) {
      if (prop === 'on') {
        return (method, callback) => {
          window.addEventListener('rushChainChanged', ({ detail }) => {
            const result = JSON.parse(detail)
            callback('0x' + result.chainIds[window.ethereumProxyChain].toString(16))
          })
          window.addEventListener('rushEthereumOverrideChanged', ({ detail }) => {
            const result = JSON.parse(detail)
            callback('0x' + result.chainIds[result.chain].toString(16))
          })
        }
      }
      return Reflect.get(...arguments)
    }
  }
  const injectionName = window.providerManager.getInjectionName(chain)
  window.ethereum = new Proxy(window[injectionName], overrideHandler)
  window.isMetaMask = true
}

function overrideEthereum(chain) {
  window.addEventListener('rushEthereumOverrideChanged', ({ detail }) => {
    const result = JSON.parse(detail)
    proxyEthereum(result.chain)
  })
  proxyEthereum(chain)
}

if (!window.ethereum) {
  overrideEthereum('${chain}')
  const retryLimit = 5
  let retries = 0
  const interval = setInterval(() => {
    retries++
    if (window.ethereum && !window.ethereum.isLiquality) {
      overrideEthereum('${chain}')
      clearInterval(interval)
    }
    if (retries >= retryLimit) clearInterval(interval)
  }, 1000)
} else {
  overrideEthereum('${chain}')
}
`

export { providerManager, ethereumProvider, overrideEthereum }
