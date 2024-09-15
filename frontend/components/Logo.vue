<template>
  <div class="flex items-end justify-self-center gap-1">
    <img :src="logoSource" alt="logo" class="w-14 h-14" />
    <h1
      class="text-3xl leading-none"
      :class="isDarkThemed ? 'text-white' : 'text-black'"
    >
      MultiCash
    </h1>
  </div>
</template>

<script lang="ts">
import { storeToRefs } from "pinia";
import { useConfigStore } from "~/store/config";

export default defineComponent({
  setup() {
    const { appThemeColor } = storeToRefs(useConfigStore());

    const isDarkThemed = computed(() =>
      ["dark", "midnight"].includes(appThemeColor.value)
    );

    const logoSource = computed(() => {
      if (isDarkThemed.value) {
        return "./whitelogo.png";
      }
      return "./logo.png";
    });

    return { logoSource, isDarkThemed };
  },
});
</script>
