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
          class="card absolute inset-0 text-white rounded-3xl flex flex-col justify-between p-6 border-[1px] border-base backface-hidden"
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
            <p class="text-tiny">{{ user.name }}</p>
          </div>
        </div>

        <!-- Back Side of the Card -->
        <div
          class="card absolute inset-0 text-white rounded-3xl flex flex-col justify-between p-6 border-[1px] border-base backface-hidden transform rotate-y-180"
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
  background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><defs><pattern id='subtleGrid' patternUnits='userSpaceOnUse' width='20' height='20'><rect width='20' height='20' fill='black'/><path d='M0 0 L20 0 M0 20 L20 20 M0 0 L0 20 M20 0 L20 20' stroke='gray' stroke-width='1'/></pattern></defs><rect width='100%' height='100%' fill='url(%23subtleGrid)' /></svg>");
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}
</style>
