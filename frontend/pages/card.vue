<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Card" />
  </div>
  <CommonImage image="./card.png" alt="card" custom-css="w-96 h-56" />
  <h1 class="text-2xl">Coming Soon</h1>
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
