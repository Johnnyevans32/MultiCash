<template>
  <div
    class="sticky top-0 z-10 bg-bgbase inset-x-0 px-4 py-2 md:py-0 border-b-[1px] md:border-b-0 border-base"
  >
    <nav class="grid grid-cols-3 justify-items-center">
      <div class="justify-self-start flex space-x-2 w-40 items-center">
        <span>{{ config.public.appName }}</span>
      </div>

      <div class="flex justify-center">
        <ul class="md:flex hidden">
          <NuxtLink
            :to="item.href"
            role="tab"
            class="cursor-pointer mr-4 inline-block py-4 text-sm text-lightbase border-b border-b-transparent"
            v-bind:class="{ active: activeNavbar === item.name }"
            v-for="item in items"
            :key="item.name"
          >
            <font-awesome-icon :icon="item.icon" />
            {{ item.name }}
          </NuxtLink>
        </ul>
      </div>
    </nav>

    <nav
      class="md:hidden fixed bottom-0 inset-x-0 flex justify-between bg-bgbase text-lg text-lightbase border-t-[1px] border-base"
    >
      <NuxtLink
        v-for="item in items"
        :to="item.href"
        :key="item.name"
        role="tab"
        v-bind:class="{ active: activeNavbar === item.name }"
        class="cursor-pointer w-full flex flex-col py-3 px-2 text-center hover:text-base transition duration-300"
      >
        <font-awesome-icon :icon="item.icon" />
        <span class="text-xs">{{ item.name }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    const route = useRoute();
    const config = useRuntimeConfig();

    const items = ref([
      {
        name: "Wallet",
        icon: "fa-solid fa-wallet",
        href: "/",
      },
      {
        name: "Send",
        icon: "fa-solid fa-paper-plane",
        href: "/send",
      },
      {
        name: "Exchange",
        icon: "fa-solid fa-exchange",
        href: "/exchange",
      },
      {
        name: "Card",
        icon: "fa-solid fa-credit-card",
        href: "/card",
      },
      {
        name: "Settings",
        icon: "fa-solid fa-gears",
        href: "/settings",
      },
    ]);

    const activeNavbar = computed(() => {
      const { path } = route;
      if (!path) return "Wallet";

      const pathSlice = (path as string).split("/");

      return items.value.find(
        (item: { href: string }) => item.href === `/${pathSlice[1]}`
      )?.name;
    });

    return {
      items,
      activeNavbar,
      config,
    };
  },
});
</script>

<style scoped>
[role="tab"].active {
  @apply text-base md:border-b-base;
}
</style>
