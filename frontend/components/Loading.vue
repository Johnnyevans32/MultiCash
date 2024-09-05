<template>
  <div
    v-if="loadingScreenEnabled"
    class="backdrop-blur-xl absolute h-full w-full flex items-center justify-center z-20"
  >
    <div class="text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="inline w-20 h-20"
        viewBox="0 0 24 24"
      >
        <rect width="10" height="10" x="1" y="1" fill="#888888" rx="1">
          <animate
            id="svgSpinnersBlocksShuffle30"
            fill="freeze"
            attributeName="x"
            begin="0;svgSpinnersBlocksShuffle3b.end"
            dur="0.2s"
            values="1;13"
          />
          <animate
            id="svgSpinnersBlocksShuffle31"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle38.end"
            dur="0.2s"
            values="1;13"
          />
          <animate
            id="svgSpinnersBlocksShuffle32"
            fill="freeze"
            attributeName="x"
            begin="svgSpinnersBlocksShuffle39.end"
            dur="0.2s"
            values="13;1"
          />
          <animate
            id="svgSpinnersBlocksShuffle33"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle3a.end"
            dur="0.2s"
            values="13;1"
          />
        </rect>
        <rect width="10" height="10" x="1" y="13" fill="#888888" rx="1">
          <animate
            id="svgSpinnersBlocksShuffle34"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle30.end"
            dur="0.2s"
            values="13;1"
          />
          <animate
            id="svgSpinnersBlocksShuffle35"
            fill="freeze"
            attributeName="x"
            begin="svgSpinnersBlocksShuffle31.end"
            dur="0.2s"
            values="1;13"
          />
          <animate
            id="svgSpinnersBlocksShuffle36"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle32.end"
            dur="0.2s"
            values="1;13"
          />
          <animate
            id="svgSpinnersBlocksShuffle37"
            fill="freeze"
            attributeName="x"
            begin="svgSpinnersBlocksShuffle33.end"
            dur="0.2s"
            values="13;1"
          />
        </rect>
        <rect width="10" height="10" x="13" y="13" fill="#888888" rx="1">
          <animate
            id="svgSpinnersBlocksShuffle38"
            fill="freeze"
            attributeName="x"
            begin="svgSpinnersBlocksShuffle34.end"
            dur="0.2s"
            values="13;1"
          />
          <animate
            id="svgSpinnersBlocksShuffle39"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle35.end"
            dur="0.2s"
            values="13;1"
          />
          <animate
            id="svgSpinnersBlocksShuffle3a"
            fill="freeze"
            attributeName="x"
            begin="svgSpinnersBlocksShuffle36.end"
            dur="0.2s"
            values="1;13"
          />
          <animate
            id="svgSpinnersBlocksShuffle3b"
            fill="freeze"
            attributeName="y"
            begin="svgSpinnersBlocksShuffle37.end"
            dur="0.2s"
            values="1;13"
          />
        </rect>
      </svg>

      <p class="text-base mt-5">working...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { useConfigStore } from "~/store/config";

export default defineComponent({
  setup() {
    const { loadingScreenEnabled } = storeToRefs(useConfigStore());
    return { loadingScreenEnabled };
  },
});
</script>
