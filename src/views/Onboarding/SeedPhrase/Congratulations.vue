<template>
    <div class="login-wrapper congrats-seed no-outer-pad">
        <div class="congrats-seed_top">
            <h1 class="mb-3">Well Done!</h1>
            <!-- <CompletedIcon class="congrats-seed_icon" /> -->
            <WellDoneIcon class="congrats-seed_icon" />
        </div>
    </div>
</template>

<script>

import CompletedIcon from '@/assets/icons/checkmark-large.svg'
import WellDoneIcon from '@/assets/icons/well-done.svg'

export default {
  components: {
    CompletedIcon,
    WellDoneIcon
  }
}

</script>

<style lang="scss">

.congrats-seed {
  padding: 0 !important;
  overflow: hidden;
  &_top {
    z-index: 2;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
      h1 {
          color: $color-text-secondary;
      }
  }
  &_icon {
    height: 200px;
    width: 200px;
  }
  &_confetti-wrapper {
    position: relative;
    min-height: 100vh;
  }
}

[class|="confetti"] {
  position: absolute;
}

$colors: (#033fff, #1CE5C3, #F12274);

@for $i from 0 through 150 {
  $w: random(8);
  $l: random(100);
  .confetti-#{$i} {
    width: #{$w}px;
    height: #{$w*0.4}px;
    background-color: nth($colors, random(3));
    top: -10%;
    left: unquote($l+"%");
    opacity: random() + 0.5;
    transform: rotate(#{random()*360}deg);
    animation: drop-#{$i} unquote(2+random()+"s") unquote(random()+"s") infinite;
  }

  @keyframes drop-#{$i} {
    100% {
      top: 110%;
      left: unquote($l+random(15)+"%");
    }
  }
}
</style>
