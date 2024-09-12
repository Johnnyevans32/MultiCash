<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Exchange" />
  </div>
  <CommonTabSwitch :tabs="tabs" v-model="activeTab" />
</template>

<script lang="ts">
import ExchangeHistory from "~/components/exchange/ExchangeHistory.vue";
import InitiateExchange from "~/components/exchange/InitiateExchange.vue";

export default defineComponent({
  async setup() {
    useSeoMeta({
      title: "Exchange",
      ogTitle: "Exchange",
    });

    const tabs = ref([
      {
        title: "Initiate Exchange",
        value: "initiate",
        content: markRaw(InitiateExchange),
      },
      {
        title: "Exchange History",
        value: "history",
        content: markRaw(ExchangeHistory),
      },
    ]);

    const route = useRoute();
    const router = useRouter();

    const getTabIndex = (queryValue: string | null) => {
      const index = tabs.value.findIndex((tab) => tab.value === queryValue);
      return index !== -1 ? index : 0;
    };

    const activeTab = ref(getTabIndex(route.query.tab as string));

    watch(
      () => route.query.tab,
      (newTab) => {
        activeTab.value = getTabIndex(newTab as string);
      }
    );

    watch(activeTab, (newTabIndex) => {
      router.replace({
        query: {
          ...route.query,
          tab: tabs.value[newTabIndex].value,
        },
      });
    });

    return { tabs, activeTab };
  },
});
</script>
