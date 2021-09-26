<template>
  <div class="splash login-wrapper">
    <div class="splash_logo">
      <Logo />
    </div>
    <div class="splash_tagline">
      <WalletText class="splash_tagline_wallet" />
    </div>
    <div class="footer-container">
      <router-link to="/onboarding/import"><p class="text-center" id="import_with_seed_phrase_option">Import with seed phrase</p></router-link>
      <p v-if="keyUpdatedAt"><router-link to="/open"><button class="btn btn-light btn-lg btn-block btn-icon" id="open_wallet_option">Open wallet</button></router-link></p>
      <!-- <p v-if="!keyUpdatedAt"><router-link to="/onboarding/setup"><button class="btn btn-primary btn-lg btn-block btn-icon" id="create_new_wallet_option">Create a new wallet</button></router-link></p> -->
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
// import Logo from '@/assets/icons/logo.svg'
import Logo from '@/assets/icons/rush/logo-white.svg'
import WalletText from '@/assets/icons/wallet_text.svg'

export default {
  components: {
    Logo,
    WalletText
  },
  computed: mapState(['keyUpdatedAt', 'pendingProxyAddress']),
  created () {
    if (this.keyUpdatedAt) {
      this.$router.replace('/open')
    } else if (this.pendingProxyAddress) {
      this.$router.replace('/onboarding/import')
    }
  }
}
</script>

<style lang="scss">
.splash {
  &_logo {
    padding: 40px 0;

    svg {
      width: 100px;
    }
  }

  &_tagline {
    margin-bottom: 20px;
    &_wallet {
      width: 170px;
      margin-bottom: 10px;
    }

    line-height: 28px;
    font-size: 18px;
  }
}
</style>
