<template>
  <div class="import-wallet login-wrapper no-outer-pad">
    <div class="login-header">
      <LogoWallet />
    </div>
    <!-- 输入 proxyAddress -->
    <template v-if="currStep === 1">
      <div class="import-wallet_top" id="import-wallet_top">
        <h2>Input Proxy Address</h2>
        <p>Enter Rush Wallet proxy address.</p>
      </div>
      <div class="import-wallet_bottom">
        <form class="form import-wallet_address" autocomplete="off">
          <div>
            <input
              type="text"
              class="form-control form-control-sm"
              id="input_proxy_address"
              autocomplete="off"
              required
              v-model="proxyAddress"
              @input="updatePendingProxyAddress"/>
          </div>
        </form>
      </div>
      <div class="footer-container bg-white">
          <div class="footer-content">
            <button id="import_wallet_cancel_button" class="btn btn-light btn-outline-primary btn-lg btn-footer btn-icon" @click="$router.go(-1)">Cancel</button>
            <button id="import_wallet_continue_button" class="btn btn-primary btn-lg btn-footer ml-2" :disabled="disableSwitchStep2" @click="currStep = 2">Continue</button>
          </div>
      </div>
    </template>

    <template v-else>
      <div class="import-wallet_top" id="import-wallet_top">
        <h2>Import wallet</h2>
        <p>Enter the seed phrase, in the same order saved when creating your wallet.</p>
      </div>
      <div class="import-wallet_bottom">
        <div class="btn-group" id="word_button_group">
          <button
                      :class="{ active: numWords === 12 }"
                      class="btn btn-option"
                      id="twelve_words_option"
                      @click="setMnemonicLength(12)"
                    >
                      12 words
                    </button>
            <button
                      :class="{ active: numWords === 24 }"
                      class="btn btn-option"
                      id="twenty_four_words_option"
                      @click="setMnemonicLength(24)"
                    >
                      24 words
                    </button>
        </div>
        <form class="form import-wallet_seed" autocomplete="off">
          <div v-for="(e, n) in numWords" :key="n"><input type="text" class="form-control form-control-sm" id="import_wallet_word" v-model="wordList[n]" autocomplete="off" required /></div>
        </form>
      </div>
      <div class="footer-container bg-white">
          <div class="footer-content">
            <button id="import_wallet_cancel_button" class="btn btn-light btn-outline-primary btn-lg btn-footer btn-icon" @click="currStep = 1">Back</button>
            <button id="import_wallet_continue_button" class="btn btn-primary btn-lg btn-footer ml-2" :disabled="disableNext" @click="next">Continue</button>
          </div>
      </div>
    </template>

  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import LogoWallet from '@/assets/icons/rush/logo-white.svg'

console.log(1234, LogoWallet)

export default {
  components: {
    LogoWallet
  },
  data: function () {
    return {
      currStep: 1, //  1: proxyAddress, 2: passphrase
      wordList: Array(12).fill(''),
      numWords: 12,
      proxyAddress: ''
    }
  },
  mounted() {
    if (this.pendingProxyAddress) {
      this.proxyAddress = this.pendingProxyAddress
      this.currStep = 2
    }
  },
  updated: function () {
  },
  watch: {
    wordList: function (newList, oldList) {
      var words = newList[0].replaceAll('\n', ' ').replace(/\s+/g, ' ').split(' ')
      if (words.length === this.numWords) {
        for (var m = 0; m < words.length; m++) {
          this.wordList[m] = words[m]
        }
      }
    }
  },
  computed: {
    ...mapState(['wallets', 'activeWalletId', 'pendingProxyAddress']),
    wallet: function () {
      return this.wallets.find(wallet => wallet.id === this.activeWalletId)
    },
    disableSwitchStep2: function () {
      return !this.proxyAddress
    },
    disableNext: function () {
      return this.disableSwitchStep2 || this.wordList.filter(word => word === '' || /\s/.test(word)).length > 0 // TODO: this should actually validate bip39
    }
  },
  methods: {
    updatePendingProxyAddress: _.debounce(function () {
      this.$store.commit('UPDATE_PENDING_PROXY_ADDRESS', this.proxyAddress)
    }, 200),
    next () {
      const passphrase = this.wordList.join(' ')
      const proxyAddress = this.proxyAddress
      this.$router.push({ name: 'OnboardingSetup', params: { passphrase, proxyAddress } })
    },
    setMnemonicLength (words) {
      this.numWords = words
      this.wordList = Array(this.numWords).fill('')
    }
  }
}
</script>

<style lang="scss">

.num-words {
  background: $color-text-primary;

}

.import-wallet {
  padding: 50px 0 0 0 !important;
  overflow-y: scroll;

  > div {
    padding: 0 $wrapper-padding;
  }

  .import-wallet_top {
    h2 {
      margin-bottom: 10px;
    }

    p {
      margin-bottom: 0 !important;
      font-size: $font-size-sm;
    }

    padding-top: 25px;
    padding-bottom: 20px;
  }

  .import-wallet_bottom {
    background: #FFFFFF;
    color: $color-text-primary;
    padding: $wrapper-padding;

    .btn-group {
      margin-bottom: 20px;
    }

  }

  &_icon {
    width: 40px;
    margin-top: 30px;
    margin-bottom: 10px;
  }

  h5 {
    color: $color-text-secondary;
  }

  &_seed.form {
    font-size: 18px;
    font-weight: 700;
    padding-left: 0;
    margin-bottom: 10px;
    text-align: left;
    counter-reset: wordIndex;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    div {
      display: block;
      flex: 0 0 94px;
      padding-bottom: 6px;
      text-align: left;

      &::before {
        display: block;
        font-size: $font-size-tiny;
        counter-increment: wordIndex;
        content: counter(wordIndex);
        font-weight: 700;
      }

      input {
        color: $color-text-primary;
        font-weight: 700;
      }
    }
  }
  &_address.form {
    font-size: 18px;
    font-weight: 700;
    padding-left: 0;
    margin-bottom: 10px;
    text-align: left;
    counter-reset: wordIndex;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    div {
      display: block;
      flex: 1;
      padding-bottom: 6px;
      text-align: left;

      &::before {
        display: block;
        font-size: $font-size-tiny;
        content: 'Proxy Address';
        font-weight: 700;
      }

      input {
        color: $color-text-primary;
        font-weight: 700;
      }
    }
  }
}
</style>
