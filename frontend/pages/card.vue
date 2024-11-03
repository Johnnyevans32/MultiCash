<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Card" />
  </div>
  <VirtualCard />
  <h1 class="text-2xl">Effortless Global Access</h1>
  <p>
    Experience the convenience of seamless international transactions with your
    new virtual card.
  </p>

  <CommonButton
    text="Coming Soon"
    :disabled="true"
    custom-css="bg-base justify-self-center text-base"
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
