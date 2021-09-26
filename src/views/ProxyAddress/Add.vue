<template>
  <div class="add-proxy-address">
    <NavBar showMenu="true" showBack="true" backPath="/wallet" backLabel="Back">
      <span class="wallet_header"><strong>Add Proxy Address</strong></span>
    </NavBar>
    <div class="wrapper form">
      <div class="wrapper_top">
        <div class="form-group">
          <label for="chain">Select Chain</label>
          <div class="dropdown">
            <button class="btn dropdown-toggle dropdown-toggle--full-width"
                    type="button"
                    @click.stop="chainDropdownOpen = !chainDropdownOpen">
              {{ currentChainName || 'Select chain...' }}
              <ChevronUpIcon v-if="chainDropdownOpen" />
              <ChevronDownIcon v-else />
            </button>
            <ul class="dropdown-menu" :class="{ show: chainDropdownOpen }">
              <li v-for="item in chainOptions" :key="item.chainId">
                <a class="dropdown-item chain-item" href="#"
                  @click="selectChain(item.chainId)"
                  :class="{active: chainId === item.chainId }"
                >
                  <div class="chain__name">{{ item.name }}</div>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="form-group">
          <label for="chain">Select Owner Key</label>
          <div class="dropdown">
            <button class="btn dropdown-toggle dropdown-toggle--full-width"
                    type="button"
                    @click.stop="ownerKeyDropdownOpen = !ownerKeyDropdownOpen">
              {{ ownerKey ? ownerKey.name : 'Select owner key...' }}
              <ChevronUpIcon v-if="ownerKeyDropdownOpen" />
              <ChevronDownIcon v-else />
            </button>
            <ul class="dropdown-menu" :class="{ show: ownerKeyDropdownOpen }">
              <li v-for="item in ownerKeys" :key="item.publicKey">
                <a class="dropdown-item owner-key-item" href="#"
                  @click="selectOwnerKey(item)"
                  :class="{active: ownerKey && ownerKey.publicKey === item.publicKey }"
                >
                  <div class="owner-key__name">{{ item.name }}</div>
                  <div class="owner-key__public-key">{{ shortenAddress(item.publicKey) }}</div>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <fieldset>
          <div class="form-group">
            <label for="name">Proxy Address</label>
            <input type="text" v-model="proxyAddress" class="form-control form-control-sm" id="proxyAddress" placeholder="Input proxy address" autocomplete="off" required>
          </div>
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" v-model="name" class="form-control form-control-sm" id="name" placeholder="Input proxy address name" autocomplete="off" required>
          </div>
        </fieldset>
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <button id="cancel_add_token_button" class="btn btn-light btn-outline-primary btn-lg" @click="handleCancel">Cancel</button>
          <button id="add_token_button" class="btn btn-primary btn-lg" :disabled="!canAdd" @click="handleSubmit">Add Proxy Address</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { debounce } from 'lodash-es'
import cryptoassets from '@/utils/cryptoassets'
import { tokenDetailProviders } from '@/utils/asset'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import { shortenAddress } from '@/utils/address'
import { chains } from '@/utils/chains'
import { CHAIN_RPC_MAPPING, CHAIN_ID_MAPPING } from '@/constants/chains'
import { forIn } from 'lodash'

export default {
  components: {
    NavBar,
    ChevronDownIcon,
    ChevronUpIcon
  },
  data () {
    const chainOptions = _.map(chains, item => {
      const { name, chainId } = item
      return {
        name, chainId
      }
    })
    return {
      chainDropdownOpen: false,
      ownerKeyDropdownOpen: false,
      name: null,
      ownerKey: null,
      proxyAddress: '',
      CHAIN_ID_MAPPING,
      chainId: 1,
      chainOptions,
    }
  },
  computed: {
    ...mapState(['ownerKeys']),
    currentChainName() {
      let res = ''
      for (let key in CHAIN_ID_MAPPING) {
        if (CHAIN_ID_MAPPING[key] === this.chainId) {
          res = key
        }
      }
      return res
    },
    canAdd () {
      return this.chainId && this.ownerKey && this.proxyAddress
    }
  },
  methods: {
    shortenAddress,
    async selectOwnerKey (value) {
      this.ownerKey = value
      this.ownerKeyDropdownOpen = false
    },
    selectChain(chainId) {
      this.chainId = chainId
      this.chainDropdownOpen = false
    },
    handleCancel() {
      this.$router.back()
    },
    handleSubmit() {
      const payload = { 
        chainId: this.chainId,
        proxyAddress: this.proxyAddress,
        ownerPublicKey: this.ownerKey.publicKey,
        name: this.name
      }
      this.$store.commit('ADD_PROXY_ADDRESS', payload)
      this.$router.push('/wallet')
    }
  }
}
</script>

<style lang="scss">
.add-proxy-address {
  display: flex;
  flex-direction: column;
  min-height: 0;

  .form-group {
    margin-bottom: 30px;
  }
  .dropdown {
    .dropdown-menu {
      width: 100%;
      min-width: 2rem;
      border: 1px solid #D9DFE5;
      border-radius: 0;
      padding: 0;
      margin: 0;
    }
    .dropdown-item {
      height: 30px;
      display: flex;
      align-items: center;
      padding-left: 10px;
      padding-right: 10px;
      &:not(:last-child) {
        border-bottom: 1px solid $hr-border-color;
      }

      &:hover, &.active {
        background-color: #F0F7F9;
        color: $color-text-primary;
      }
    }
  }

  .dropdown-toggle {
    text-transform: capitalize;
    padding-left: 0 !important;
    font-weight: 300;
    display: flex;
    align-items: center;
    &.dropdown-toggle--full-width {
      width: 100%;
    }
    &::after {
      display: none;
    }

   svg {
      width: 8px;
      height: 4px;
      margin-left: 2px;
    }
}
}
</style>
