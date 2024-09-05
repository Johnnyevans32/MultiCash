<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Exchange" />
  </div>
  <CommonTabSwitch :tabs="tabs" />
</template>

<script lang="ts">
import ExchangeHistory from "~/components/exchange/ExchangeHistory.vue";
import ExchangeTable from "~/components/exchange/ExchangeTable.vue";
export default defineComponent({
  async setup() {
    const tabs = ref([
      {
        title: "Exchange Currency",
        content: ExchangeTable,
      },
      {
        title: "Exchange History",
        content: ExchangeHistory,
      },
    ]);

    return { tabs };
  },
});
</script>
