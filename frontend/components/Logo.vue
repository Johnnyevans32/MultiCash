<template>
  <div class="flex items-end gap-4 justify-self-center">
    <img :src="`./logo.png`" alt="logo" class="w-14 h-14 rounded-xl" />
    <h1 class="text-3xl">{{ config.public.appName }}</h1>
  </div>
</template>
<script lang="ts">
export default defineComponent({
  setup() {
    const config = useRuntimeConfig();

    return { config };
  },
});
</script>
