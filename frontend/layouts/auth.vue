<template>
  <Loading />
  <div class="grid grid-cols-4 gap-y-4 h-screen">
    <div class="col-span-4 md:col-start-2 md:col-span-2">
      <div class="grid grid-cols-1 gap-12 p-5 text-center">
        <slot />
      </div>

      <FooterBar />
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    return {};
  },
});
</script>
