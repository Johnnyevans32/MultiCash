<template>
  <div class="flex justify-center">
    <div class="relative w-[23.79rem] h-[15rem] perspective">
      <!-- Card Inner Wrapper for 3D Animation -->
      <div
        class="w-full h-full transform-style-preserve-3d transition-transform duration-1000"
        :class="{ 'rotate-y-180': isFlipped }"
        @mouseenter="flipCard"
        @mouseleave="flipCard"
      >
        <!-- Front Side of the Card -->
        <div
          class="card absolute inset-0 text-white rounded-3xl flex flex-col justify-between p-6 backface-hidden"
        >
          <div class="flex items-center justify-between">
            <CommonImage
              image="https://i.ibb.co/G9pDnYJ/chip.png"
              custom-css="h-10 w-10 !rounded-none"
            />
            <!-- <div class="flex items-end">
              <CommonImage
                image="./whitelogo.png"
                custom-css="h-8 w-8 !rounded-none"
              />
              <p class="text-white text-sm leading-none">MultiCash</p>
            </div> -->
            <span class="text-white">MultiCash</span>
          </div>
          <h1 class="text-4xl">**** **** **** ****</h1>

          <div class="flex justify-between">
            <div class="text-left">
              <p class="text-tiny">{{ user?.name }}</p>
            </div>
            <img src="https://i.ibb.co/WHZ3nRJ/visa.png" class="w-16 h-5" />
          </div>
        </div>

        <!-- Back Side of the Card -->
        <div
          class="card absolute inset-0 text-white rounded-3xl flex flex-col justify-between p-6 backface-hidden transform rotate-y-180"
        >
          <h1 class="text-3xl">Coming Soon</h1>
          <img src="https://i.ibb.co/WHZ3nRJ/visa.png" class="w-16 h-5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "~/store/user";
export default defineComponent({
  setup() {
    const isFlipped = ref(false);
    const { user } = storeToRefs(useUserStore());

    const flipCard = () => {
      isFlipped.value = !isFlipped.value;
    };

    return { isFlipped, flipCard, user };
  },
});
</script>

<style scoped>
.perspective {
  perspective: 1000px;
}

.backface-hidden {
  backface-visibility: hidden;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.card {
  background-image: url("../assets/images/card.svg");
  background-size: cover;
}
</style>
