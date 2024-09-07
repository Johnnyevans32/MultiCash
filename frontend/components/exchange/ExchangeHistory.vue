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
        @click="openExchangeModal(exchange)"
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
            <span
              class="md:hidden flex text-sm"
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

        <div class="md:flex hidden flex-col text-right">
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
  <CommonModal
    v-if="modalExchange"
    :open="updateExchangeModal"
    title="Exchange Details"
    @change-modal-status="
      (newVal) => {
        updateExchangeModal = newVal;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-2">
        <div class="flex flex-col">
          <span
            >You
            {{
              modalExchange?.status === "completed"
                ? "exchanged"
                : "are exchanging"
            }}:</span
          >
          <span class="font-bold">
            {{ modalExchange?.payinCurrency }}
            {{ formatMoney(modalExchange?.payinAmount || 0) }}
          </span>
        </div>

        <div class="flex flex-col">
          <span>For:</span>
          <span class="font-bold">
            {{ modalExchange?.payoutCurrency }}
            {{ formatMoney(modalExchange?.payoutAmount || 0) }}
          </span>
        </div>

        <div class="flex flex-col">
          <span>Exchange Rate:</span>
          <span class="font-bold">
            1 {{ modalExchange?.payinCurrency }} =
            {{ modalExchange?.payoutUnitsPerPayinUnit }}
            {{ modalExchange?.payoutCurrency }}
          </span>
        </div>

        <div class="flex flex-col">
          <span>Fees:</span>
          <span class="font-bold"
            >{{ modalExchange?.payinCurrency }}
            {{ formatMoney(modalExchange?.totalFee || 0) }}</span
          >
        </div>

        <div class="flex flex-col">
          <span>Status:</span>
          <span
            class="font-bold"
            :class="{
              'text-green-600': modalExchange?.status === 'completed',
              'text-red-600': modalExchange?.status === 'failed',
              'text-yellow-600': modalExchange?.status === 'pending',
            }"
          >
            {{ modalExchange?.status }}
          </span>
        </div>

        <div class="flex flex-col">
          <span>Date:</span>
          <span class="font-bold">
            {{
              modalExchange?.createdAt &&
              formatDate(modalExchange.createdAt, "ddd, MMM Do YYYY, h:mm:ss a")
            }}
          </span>
        </div>

        <div v-if="modalExchange?.offerings?.length" class="flex flex-col">
          <span>Exchange Route:</span>
          <ul class="font-bold flex flex-col gap-4">
            <li
              v-for="offering in modalExchange.offerings"
              :key="offering.id"
              class="border-b border-gray-300 py-2"
            >
              <div class="flex justify-between">
                <span>PFI: {{ offering.pfi?.name }}</span>
                <span
                  >Status:
                  <span
                    :class="{
                      'text-green-600': offering.status === 'completed',
                      'text-red-600': offering.status === 'failed',
                      'text-yellow-600': offering.status === 'pending',
                    }"
                  >
                    {{ offering.status }}
                  </span>
                </span>
              </div>
              <div class="flex flex-col">
                <span
                  >1 {{ offering.payinCurrency }} =
                  {{ offering.payoutUnitsPerPayinUnit }}
                  {{ offering.payoutCurrency }}</span
                >
                <span
                  >PFI Fee: {{ offering.payinCurrency }}
                  {{ formatMoney(offering.pfiFee || 0) }}</span
                >
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="updateExchangeModal = false"
        custom-css="bg-base w-full text-base"
      />
    </template>
  </CommonModal>
</template>
<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
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

    const updateExchangeModal = ref(false);
    const modalExchange = ref<IExchange>();
    const openExchangeModal = (exchange: any) => {
      modalExchange.value = exchange;
      updateExchangeModal.value = true;
    };

    const isLoadingRateExchange = ref(false);
    const rateExchange = async () => {
      if (!modalExchange.value) {
        return;
      }
      await withLoadingPromise(
        $api.exchangeService
          .rateExchange(modalExchange.value?.id, 3)
          .then(() => {
            notify({
              type: "success",
              title: `rating has been updated`,
            });
          }),
        isLoadingRateExchange
      );
    };

    return {
      config,
      exchanges,
      exchangesMetadata,
      isLoadingExchanges,
      handlePageChange,
      formatedExchanges,
      updateExchangeModal,
      openExchangeModal,
      modalExchange,
    };
  },
});
</script>
