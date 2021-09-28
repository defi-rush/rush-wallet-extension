<template>
  <div class="owner-keys-container">
    <NavBar showMenu="true" showBack="true" backPath="/wallet" backLabel="Overview">
      <span class="navbar__title">Owner Keys</span>
    </NavBar>
    <div class="owner-keys">
      <div 
        v-for="ownerKey in ownerKeys" 
        :key="ownerKey.publicKey" 
        class="owner-key-item"
        @click="onClick(ownerKey)">
        <div class="owner-key__name">{{ ownerKey.name }}</div>
        <div class="owner-key__public-key">{{ shortenAddress(ownerKey.publicKey) }}</div>
      </div>
      <div class="empty-tips" v-if="!ownerKeys || !ownerKeys.length">Empty List</div>
    </div>
    <div class="container__footer">
      <button class="btn--add-owner-key" @click="clickAdd">Add Owner Key +</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import NavBar from '@/components/NavBar.vue'
import RefreshIcon from '@/assets/icons/refresh.svg'
import { shortenAddress } from '@/utils/address'

export default {
  name: 'OwnerKeys',
  components: {
    NavBar,
    RefreshIcon,
  },
  data() {
    return {}
  },
  computed: {
    ...mapState(['ownerKeys']),
  },
  methods: {
    shortenAddress,
    onClick(ownerKey) {
      console.log('@@@ onClick.ownerKey', ownerKey)
    },
    clickAdd() {
      this.$router.push('/owner-keys/add')
    }
  }
}
</script>

<style lang="scss" scoped>
.owner-keys-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding-bottom: 44px;
  overflow: hidden;
}
.navbar__title {
  text-align: center;
  line-height: 36px;
}
.owner-keys {
  height: calc(100% - 44px);
  overflow: auto;
}
.container__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
}
.btn--add-owner-key {
  width: 100%;
  height: 44px;
  padding: 0;
  line-height: 44px;
  text-align: center;
  border: none;
  outline: none;
  box-shadow: none;
}
.empty-tips {
  width: 100%;
  text-align: center;
  line-height: 40px;
  margin-top: 40px;
}
.owner-key-item {
  width: 100%;
  padding: 5px 20px;
  border-bottom: 1px solid #e0e0e0;
}
.owner-key__name {

}
</style>