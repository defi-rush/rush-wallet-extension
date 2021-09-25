<template>
  <!-- <WalletAccounts @item-selected="onAccountSelected"
                  :accounts="accountsData"/> -->
  <ProxyAddressAccount @item-selected="onAccountSelected" :fiatBalances="proxyAddressAccountFiatBalances"/>
</template>

<script>
import { mapGetters } from 'vuex'
import WalletAccounts from '@/components/WalletAccounts'
import ProxyAddressAccount from '@/components/ProxyAddressAccount'

export default {
  computed: {
    ...mapGetters(['proxyAddressAccountFiatBalances'])
  },
  components: {
    // WalletAccounts,
    ProxyAddressAccount
  },
  methods: {
    onAccountSelected ({ account, asset }) {
      const _asset = asset || account.assets[0]
      this.$router.push(`/accounts/${account.id}/${_asset}`)
    }
  }
}
</script>
<style lang="scss">
</style>
