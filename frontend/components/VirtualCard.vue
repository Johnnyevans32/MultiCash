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
          class="absolute inset-0 bg-black text-white rounded-3xl flex flex-col justify-between p-6 border-[1px] border-base backface-hidden"
        >
          <div class="flex items-center justify-between">
            <CommonImage
              image="https://i.ibb.co/G9pDnYJ/chip.png"
              custom-css="h-10 w-10"
            />
            <div class="flex items-end">
              <CommonImage
                image="./whitelogo.png"
                custom-css="h-8 w-8 rounded-none"
              />
            </div>
          </div>
          <h1 class="md:text-3xl text-lg">**** **** **** ****</h1>

          <div class="self-start text-left">
            <p class="text-sm">NAME ON CARD</p>
            <p class="text-sm">XXXX</p>
          </div>
        </div>

        <!-- Back Side of the Card -->
        <div
          class="absolute inset-0 bg-black text-white rounded-3xl flex flex-col justify-between p-6 border-[1px] border-base backface-hidden transform rotate-y-180"
        >
          <h1 class="md:text-3xl text-lg">Coming Soon</h1>
          <CommonImage
            image="https://i.ibb.co/WHZ3nRJ/visa.png"
            custom-css="w-16 h-5 rounded-none"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    const isFlipped = ref(false);

    const flipCard = () => {
      isFlipped.value = !isFlipped.value;
    };

    return { isFlipped, flipCard };
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
</style>
