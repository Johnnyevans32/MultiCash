<template>
  <div v-if="isLoadingExchanges">
    <div v-for="i in 2" :key="i">
      <div class="h-2 w-20 bg-base rounded mb-2"></div>
      <div
        v-for="i in 2"
        :key="i"
        class="cursor-progress p-5 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
      >
        <div class="flex space-x-2 items-center">
          <div class="bg-base h-10 w-10 rounded-xl"></div>

          <div class="flex flex-col gap-2">
            <div class="h-2 w-32 bg-base rounded"></div>
            <div class="h-2 w-20 bg-base rounded"></div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="h-2 w-28 bg-base rounded"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="!isLoadingExchanges && exchanges.length">
    <div
      v-for="(exchanges, date) in formatedExchanges"
      :key="date"
      class="text-left"
    >
      <span>{{ date }}</span>

      <div
        v-for="exchange in exchanges"
        :key="exchange.id"
        class="cursor-pointer py-5 md:px-5 px-2 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base"
      >
        <div class="flex md:space-x-2 space-x-1 items-center">
          <CommonImage type="icon" image="fa-solid fa-exchange" />

          <div class="flex flex-col text-left">
            <span class="truncate">
              {{ formatMoney(exchange.payinAmount) }}
              {{ exchange.payinCurrency }}
              <font-awesome-icon icon="fas fa-arrow-right " class="mx-1" />
              {{ formatMoney(exchange.payoutAmount) }}
              {{ exchange.payoutCurrency }}
            </span>
            <span class="text-xs"
              >Fee: {{ exchange.totalFee }} {{ exchange.payinCurrency }}</span
            >
          </div>
        </div>

        <div class="flex flex-col text-right">
          <span
            class="md:text-tbase text-sm"
            :class="
              exchange?.status === 'completed'
                ? 'text-green-600'
                : exchange?.status === 'failed'
                ? 'text-red-600'
                : 'text-yellow-600'
            "
            >{{ exchange.status }}</span
          >
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <font-awesome-icon class="text-7xl mb-5" icon="sack-xmark" />
    <p>Nothing to see here</p>
    <p>your currency exchanges will appear here once they arrive.</p>
  </div>
  <CommonPaginationBar
    v-if="exchanges.length"
    :currentPage="exchangesMetadata?.page"
    :totalItems="exchangesMetadata?.totalDocs"
    @change-option="handlePageChange"
  />
</template>
<script lang="ts">
import type { IExchange } from "~/types/exchange";
import { type IMetadata } from "~/types/user";
export default defineComponent({
  setup() {
    const config = useRuntimeConfig();
    const { $api } = useNuxtApp();

    const { withLoadingPromise } = useLoading();

    onBeforeMount(async () => {
      await fetchExchanges();
    });

    const currentPage = ref(1);
    const handlePageChange = (newVal: number) => {
      currentPage.value = newVal;
      fetchExchanges();
    };

    const exchanges = ref<IExchange[]>([]);
    const exchangesMetadata = ref<IMetadata>();

    const formatedExchanges = computed<Record<string, IExchange[]>>(() =>
      groupByDate(exchanges.value, "createdAt")
    );

    const isLoadingExchanges = ref(false);
    const fetchExchanges = async () => {
      await withLoadingPromise(
        $api.exchangeService
          .fetchExchanges(currentPage.value)
          .then(({ data, metadata }) => {
            exchangesMetadata.value = metadata;
            exchanges.value = data;
          }),
        isLoadingExchanges
      );
    };

    return {
      config,
      exchanges,
      exchangesMetadata,
      isLoadingExchanges,
      handlePageChange,
      formatedExchanges,
    };
  },
});
</script>
