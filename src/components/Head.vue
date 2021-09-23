<template>
  <div class="head">
    <router-link to="/wallet" class="head_logo" id="wallet_header_logo"><LogoIcon /></router-link>
    <div id="head_select-chains" class="head_select-chains" @click.stop="showDropdown = !showDropdown">
      {{ formatProxyAddress(activeProxyAddress) }}
      <ChevronUpIcon v-if="showDropdown" />
      <ChevronDownIcon v-else />
      <ul class="menu_list" id="list_of_proxy_address" v-if="showDropdown" v-click-away="hideDropdown">
        <li
          v-for="(item, index) in proxyAddresses" :key="index"
          :class="{ active: index === activeProxyAddressIndex }"
          @click="switchProxyAddress(index)"
        >{{ formatProxyAddress(item) }}</li>
        <li @click="$router.push('/proxy-address/add')">
          <CreateIcon class="create-icon" /> Add Proxy Address
        </li>
      </ul>
    </div>
    <!-- <HeadMenu /> -->
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapState, mapGetters } from 'vuex'

import clickAway from '@/directives/clickAway'
import LogoIcon from '@/assets/icons/rush/logo.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import HeadMenu from '@/components/HeadMenu'
import { CHAIN_ID_MAPPING } from '@/constants/chains'
import CreateIcon from '@/assets/icons/create_icon.svg'

const getChainNameById = (chainId) => {
  let res
  _.forEach(CHAIN_ID_MAPPING, (cid, chainName) => {
    if (chainId === cid) {
      res = chainName
    }
  })
  return res
}

const getMaskedAddress = (address = '') => {
  return address.substr(0, 6) + '...' + address.substr(address.length - 4)
}

export default {
  directives: {
    clickAway
  },
  components: {
    ChevronUpIcon,
    ChevronDownIcon,
    LogoIcon,
    HeadMenu,
    CreateIcon
  },
  data () {
    return {
      showDropdown: false,
    }
  },
  computed: {
    ...mapState(['wallets', 'activeWalletId', 'activeNetwork', 'activeProxyAddressIndex', 'proxyAddresses']),
    ...mapGetters(['activeProxyAddress']),
    wallet: function () {
      return this.wallets.find(wallet => wallet.id === this.activeWalletId)
    }
  },
  methods: {
    ...mapActions(['changeActiveProxyAddressIndex']),
    formatProxyAddress(item) {
      const { chainId, proxyAddress } = item || {}
      if (!chainId || !proxyAddress) return 'Unknown Proxy address'
      return `${getMaskedAddress(proxyAddress)} - ${getChainNameById(chainId)}`
    },
    hideDropdown () {
      this.showDropdown = false
    },
    async switchProxyAddress(index) {
      await this.changeActiveProxyAddressIndex({ index })
      this.showDropdown = false
    }
  }
}
</script>

<style lang="scss">
.head {
  position: relative;
  height: 36px;
  border-bottom: 1px solid $hr-border-color;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;

  &_logo, &_logo svg {
    height: 12px;
  }

  &_select-chains {
    height: 36px;
    display: flex;
    font-size: $font-size-tiny;
    justify-content: center;
    align-items: center;
    text-transform: capitalize;
    cursor: pointer;

    svg {
      height: 6px;
      margin-left: 4px;
    }
  }
}
</style>
