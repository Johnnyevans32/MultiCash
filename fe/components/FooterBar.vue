<template>
  <div class="grid grid-cols-1 justify-items-center py-4">
    <div class="flex items-end gap-2">
      <span>{{ config.public.appName }}</span>
    </div>
    <p>{{ config.public.description }}</p>
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
