<template>
  <div class="account-assets active">
    <ListItem 
      v-for="asset in proxyAddressAccount.assets" 
      :key="asset.symbol"
      :id="asset.symbol"
    >
      <template #icon class="account-asset-item">
        <img :src="asset.logoURI" class="asset-icon" />
      </template>
      {{ asset.name }}
      <template #detail>
        {{ prettyBalance(proxyAddressAccount.balances[asset.symbol], asset.symbol) }} {{asset.symbol}}
      </template>
      <template #detail-sub v-if="fiatBalances[asset.symbol]">
        ${{ formatFiat(fiatBalances[asset.symbol]) }}
      </template>
    </ListItem>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import ListItem from '@/components/ListItem'
import { prettyBalance, formatFiat } from '@/utils/coinFormatter'
import { getAssetIcon } from '@/utils/asset'
import { map } from 'lodash'

export default {
  components: {
    ListItem,
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState(['proxyAddressAccount']),
    ...mapGetters(['proxyAddressAccountFiatBalances']),
    fiatBalances() {
      return this.proxyAddressAccountFiatBalances.fiatBalances
    },
  },
  methods: {
    getAssetIcon,
    prettyBalance,
    formatFiat,
    selectItem (account, asset) {
      this.$emit('item-selected', { account, asset })
    }
  }
}
</script>
<style lang="scss">

.detail-content {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.account-assets {
  margin: 0;
  height: auto;
  width: 100%;
  display: none;

  &.active {
    display: block;
  }

  .account-asset-item {
    padding-left: 30px;
  }

  .list-item-icon {
    margin-left: 33px !important;
  }
}

.prefix-icon-container {
  display: flex;
  align-items: center;
  margin-left: 12px;
  .prefix-icon {
    width: 12px;
  }
}

.account-color {
  width: 5px;
  height: 60px;
  position: absolute;
  left: 0;
  margin-right: 5px;
}
</style>
