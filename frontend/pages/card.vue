<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Card" />
  </div>
  <VirtualCard />
  <h1 class="text-2xl">Go Global With Ease</h1>
  <p>Unlock a seamless global experience with your new virtual card.</p>

  <CommonButton
    text="Coming Soon"
    :disabled="true"
    custom-css="bg-base w-full text-base"
  />
</template>

<script lang="ts">
export default defineComponent({
  async setup() {
    useSeoMeta({
      title: "Card",
      ogTitle: "Card",
    });
    return {};
  },
});
</script>
