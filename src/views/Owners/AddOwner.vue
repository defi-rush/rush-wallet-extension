<template>
  <div class="add-owner-key">
    <div class="wrapper">
      <div class="add-owner-key_top" id="add-owner-key_top">
        <h2>Add Owner Key</h2>
        <p>Enter the seed phrase, to add new owner key.</p>
      </div>
      <div class="add-owner-key_bottom">
        <form class="form add-owner-key_name" autocomplete="off">
          <div class="form-item">
            <input
              type="text"
              class="form-control form-control-sm"
              autocomplete="off"
              required
              v-model="ownerKeyName"/>
          </div>
        </form>
        <div class="btn-group" id="word_button_group">
          <button
            :class="{ active: numWords === 12 }"
            class="btn btn-option"
            id="twelve_words_option"
            @click="() => setMnemonicLength(12)">12 words</button>
          <button
            :class="{ active: numWords === 24 }"
            class="btn btn-option"
            id="twenty_four_words_option"
            @click="() => setMnemonicLength(24)">24 words</button>
          <span v-if="errMsg">{{ errMsg }}</span>
        </div>
        <form class="form add-owner-key_seed" autocomplete="off">
          <div v-for="(e, n) in numWords" :key="n"><input type="text" class="form-control form-control-sm" id="import_wallet_word" v-model="wordList[n]" autocomplete="off" required /></div>
        </form>
      </div>
    </div>
    <div class="footer-container bg-white">
      <div class="footer-content">
        <button id="import_wallet_cancel_button" class="btn btn-light btn-outline-primary btn-lg btn-footer btn-icon" @click="$router.back()">Back</button>
        <button id="import_wallet_continue_button" class="btn btn-primary btn-lg btn-footer ml-2" :disabled="disableNext" @click="onSubmit">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
export default {
  data() {
    return {
      wordList: Array(12).fill(''),
      numWords: 12,
      ownerKeyName: '',
      errMsg: ''
    }
  },
  computed: {
    ...mapState(['ownerKeys']),
    disableNext: function () {
      return !this.ownerKeyName || this.wordList.filter(word => word === '' || /\s/.test(word)).length > 0 // TODO: this should actually validate bip39
    }
  },
  watch: {
    wordList: function (newList, oldList) {
      var words = newList[0].replaceAll('\n', ' ').replace(/\s+/g, ' ').split(' ')
      if (words.length === this.numWords) {
        for (var m = 0; m < words.length; m++) {
          this.wordList[m] = words[m]
        }
      }
    },
  },
  methods: {
    setMnemonicLength (words) {
      this.numWords = words
      this.wordList = Array(this.numWords).fill('')
    },
    async onSubmit () {
      try {
        const mnemonic = this.wordList.join(' ')
        const ownerKeyName = this.ownerKeyName || ''
        await this.$store.dispatch('addOwnerKey', { mnemonic, ownerKeyName })
        this.$router.back()
      } catch (error) {
        // TODO 这里的错误不会被捕捉到，因为被 Background 里 ACTION_REQUEST catch 到了
        console.log(error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.add-owner-key {
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-y: hidden;
  padding-bottom: 56px;
  position: relative;
  .wrapper {
    height: 100%;
    overflow: auto;
  }

  .add-owner-key_top {
    // padding: 0 $wrapper-padding;
    h2 {
      margin-bottom: 10px;
    }

    p {
      margin-bottom: 0 !important;
      font-size: $font-size-sm;
    }
    padding-bottom: 20px;
  }

  .add-owner-key_bottom {
    background: #FFFFFF;
    color: $color-text-primary;
    // padding: 0 $wrapper-padding;

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
  &_name.form {
    font-size: 18px;
    font-weight: 700;
    padding-left: 0;
    margin-bottom: 10px;
    text-align: left;
    counter-reset: wordIndex;
    margin-top: 15px;
    div.form-item {
      display: block;
      flex: 1;
      padding-bottom: 15px;
      text-align: left;

      &::before {
        display: block;
        font-size: $font-size-tiny;
        content: '';
        font-weight: 700;
      }
      &:nth-child(1):before {
        content: 'Owner Key Name';
      }

      input {
        color: $color-text-primary;
        font-weight: 700;
      }
    }
  }
}
.footer-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
}
</style>