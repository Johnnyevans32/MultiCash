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
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="h-2 w-20 bg-base rounded"></div>
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
          <font-awesome-icon icon="exchange" />

          <span class="truncate md:text-sm text-xs">
            {{ exchange.payinCurrency }}
            {{ formatMoney(exchange.payinAmount) }}
            <font-awesome-icon icon="fas fa-arrow-right " class="mx-1" />
            {{ exchange.payoutCurrency }}
            {{ formatMoney(exchange.payoutAmount) }}
          </span>
        </div>

        <span
          class="md:text-xs text-tiny py-1 px-2 rounded-lg"
          :class="exchangeStatusStyles[exchange.status]"
        >
          {{ exchange?.status }}
        </span>
      </div>
    </div>
  </div>

  <div v-else>
    <font-awesome-icon class="text-7xl mb-5" icon="money-bill-transfer" />
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
            {{ formatMoney(modalExchange?.payoutUnitsPerPayinUnit, 5) }}
            {{ modalExchange?.payoutCurrency }}
          </span>
          <span class="font-bold">
            1 {{ modalExchange.payoutCurrency }} =
            {{ formatMoney(1 / modalExchange.payoutUnitsPerPayinUnit, 5) }}
            {{ modalExchange.payinCurrency }}
          </span>
        </div>

        <div class="flex flex-col">
          <span>Fee:</span>
          <span class="font-bold"
            >{{ modalExchange?.payinCurrency }}
            {{ formatMoney(modalExchange?.totalFee || 0) }}</span
          >
        </div>

        <div class="flex flex-col items-start">
          <span>Status:</span>
          <span
            class="font-bold md:text-xs text-tiny py-1 px-2 rounded-lg"
            :class="exchangeStatusStyles[modalExchange.status]"
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

        <div v-if="modalExchange.completionDate" class="flex flex-col">
          <span>Completion Date:</span>
          <span class="font-bold">
            {{
              formatDate(
                modalExchange.completionDate,
                "ddd, MMM Do YYYY, h:mm:ss a"
              )
            }}
          </span>
        </div>

        <div
          v-if="modalExchange?.offerings?.length"
          class="flex flex-col gap-2 font-bold"
        >
          <span>Exchange Route:</span>
          <ol>
            <li
              v-for="(offering, index) in modalExchange.offerings"
              :key="offering.id"
              class="group relative pb-5 pl-7 last:pb-0"
            >
              <!-- Vertical timeline line -->
              <div
                class="absolute bottom-0 left-[calc(0.25rem-0.5px)] top-0 w-px bg-base group-first:top-3"
                v-if="index !== modalExchange.offerings.length - 1"
              ></div>

              <font-awesome-icon
                :icon="
                  offering.status === 'completed'
                    ? 'check-circle'
                    : 'dot-circle'
                "
                :class="offeringStatusStyles[offering.status]"
                class="bg-white absolute -left-1 top-1 rounded-full"
              />

              <div class="flex flex-col">
                <div class="flex justify-between">
                  <span>{{ offering.pfi?.name }}</span>

                  <span
                    :class="offeringStatusStyles[offering.status]"
                    class="md:text-xs text-tiny py-1 px-2 rounded-lg"
                  >
                    {{ offering.status.replace("_", " ") }}
                  </span>
                </div>
                <span>
                  1 {{ offering.payinCurrency }} =
                  {{ formatMoney(offering.payoutUnitsPerPayinUnit, 5) }}
                  {{ offering.payoutCurrency }}
                </span>
                <div class="flex justify-between">
                  <span>
                    PFI fee: {{ offering.payinCurrency }}
                    {{ formatMoney(offering.pfiFee || 0) }}
                  </span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="updateExchangeModal = false"
        custom-css="bg-base w-full text-base"
      />
      <CommonButton
        v-if="
          !modalExchange.rating &&
          !modalExchange.comment &&
          modalExchange.status === 'completed'
        "
        text="Give feedback"
        @btn-action="
          () => {
            updateExchangeModal = false;
            feedbackModal = true;
          }
        "
        custom-css="!bg-blue-600 w-full text-white"
      />

      <CommonButton
        v-if="
          modalExchange.offerings.find((i) =>
            ['awaiting_order', 'processing'].includes(i.status)
          )
        "
        text="Cancel Exchange"
        :loading="isLoadingCloseOffering"
        @btn-action="
          closeOffering(
            modalExchange.offerings.find((i) =>
              ['awaiting_order', 'processing'].includes(i.status)
            )?.id || ''
          )
        "
        custom-css="bg-red-600 text-white w-full"
      />
    </template>
  </CommonModal>

  <CommonModal
    :open="feedbackModal"
    title="Give feedback on exchange"
    @change-modal-status="
      (value) => {
        feedbackModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <CommonRatingInput v-model="rating" :maxRating="5" />
        <CommonTextArea
          v-model="comment"
          placeholder="Your feedback helps us improve. Type here..."
          title="Add comment"
          @keyup.enter="giveFeedbackOnExchange"
        />
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="feedbackModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
      <CommonButton
        text="Send"
        @btn-action="giveFeedbackOnExchange"
        custom-css="!bg-blue-600 w-full text-white"
        :loading="isLoadingGiveFeedbackOnExchange"
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
    const { $api } = useNuxtApp();

    const { withLoadingPromise } = useLoading();

    onBeforeMount(() => {
      fetchExchanges();
    });

    const route = useRoute();
    watch(
      () => route.query.r,
      () => {
        fetchExchanges();
      }
    );

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

    const isLoadingGiveFeedbackOnExchange = ref(false);
    const comment = ref(modalExchange.value?.comment);
    const rating = ref(modalExchange.value?.rating || 0);
    const feedbackModal = ref(false);
    const giveFeedbackOnExchange = async () => {
      if (!modalExchange.value) {
        return;
      }
      await withLoadingPromise(
        $api.exchangeService
          .rateExchange(modalExchange.value?.id, rating.value, comment.value)
          .then(() => {
            fetchExchanges();
            feedbackModal.value = false;
            notify({
              type: "success",
              title: `acknowledged`,
            });
          }),
        isLoadingGiveFeedbackOnExchange
      );
    };

    const offeringStatusStyles = ref<Record<any, string>>({
      pending: "text-blue-700 bg-blue-100",
      processing: "text-yellow-700 bg-yellow-100",
      awaiting_order: "text-orange-700 bg-orange-100",
      order_placed: "text-purple-700 bg-purple-100",
      cancelled: "text-red-700 bg-red-100",
      completed: "text-green-700 bg-green-100",
    });

    const exchangeStatusStyles = ref<Record<any, string>>({
      pending: "text-blue-700 bg-blue-100",
      processing: "text-yellow-700 bg-yellow-100",
      completed: "text-green-700 bg-green-100",
      cancelled: "text-red-700 bg-red-100",
      partially_completed: "text-orange-700 bg-orange-100",
    });

    const reason = ref("");
    const isLoadingCloseOffering = ref(false);
    const closeOffering = async (offeringId: string) => {
      await withLoadingPromise(
        $api.exchangeService
          .closeOffering(offeringId, reason.value)
          .then(() => {
            updateExchangeModal.value = false;
            fetchExchanges();
            notify({
              type: "success",
              title: `acknowledged`,
            });
          }),
        isLoadingCloseOffering
      );
    };
    return {
      exchanges,
      exchangesMetadata,
      isLoadingExchanges,
      handlePageChange,
      formatedExchanges,
      updateExchangeModal,
      openExchangeModal,
      modalExchange,
      feedbackModal,
      comment,
      isLoadingGiveFeedbackOnExchange,
      giveFeedbackOnExchange,
      rating,
      offeringStatusStyles,
      exchangeStatusStyles,
      closeOffering,
      isLoadingCloseOffering,
    };
  },
});
</script>
