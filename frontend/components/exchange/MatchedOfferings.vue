<template>
  <div class="flex flex-col gap-2 text-left">
    <div class="flex items-center justify-between">
      <span class="md:text-sm text-xs">Select your prefered offering:</span>
      <CommonListbox
        :selected="sortMethod"
        :options="['Cheapest fee', 'Highest payout', 'Fastest settlement time']"
        @change-option="
          (val) => {
            sortMethod = val;
          }
        "
        customCss="w-full md:text-sm text-xs"
      />
    </div>

    <div
      v-for="(matchedOffering, index) in sortedMatchedOfferings"
      :key="index"
      class="cursor-pointer py-4 px-5 flex flex-col gap-4 rounded-xl bg-lightbase border-[1px] border-base md:text-sm text-xs"
      @click="selectOffering(matchedOffering)"
    >
      <div class="flex items-center justify-between">
        <div>
          <span>PFI(s) Fee:</span>
          <span class="block font-bold">
            {{ matchedOffering.payinCurrency }}
            {{ formatMoney(matchedOffering.cumulativeFee) }}
          </span>
        </div>

        <span
          :class="{
            'bg-blue-100 text-blue-700': matchedOffering.offerings.length > 1,
            'bg-green-100 text-green-700':
              matchedOffering.offerings.length === 1,
          }"
          class="md:text-xs text-tiny py-1 px-2 rounded-xl"
        >
          {{ matchedOffering.offerings.length > 1 ? "chained" : "single" }}
          offering
        </span>
        <div class="text-right">
          <span>Settlement Time:</span>
          <span class="block font-bold">
            {{
              convertTime(
                matchedOffering.cumulativeSettlementTimeInSecs,
                "seconds",
                "hours"
              )
            }}
            hours
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <span>Exchange Rate:</span>
          <span class="block text-green-600 font-bold">
            1 {{ matchedOffering.payinCurrency }} =
            {{
              formatMoney(matchedOffering.cumulativePayoutUnitsPerPayinUnit, 8)
            }}
            {{ matchedOffering.payoutCurrency }}
          </span>
        </div>

        <CommonButton
          text="Select Offering"
          @btn-action="selectOffering(matchedOffering)"
          custom-css="!bg-blue-600 text-white"
        />
      </div>
    </div>
  </div>

  <CommonModal
    v-if="selectedOffering"
    :open="exchangeModal"
    title="Exchange Summary"
    @change-modal-status="
      (val) => {
        exchangeModal = val;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4 text-base">
        <div class="flex flex-col gap-2">
          <span class="font-bold">Selected Exchange Route:</span>

          <ol>
            <li
              v-for="(offering, index) in selectedOffering.offerings"
              :key="index"
              class="group relative pb-3 pl-7 last:pb-0"
            >
              <div
                class="absolute bottom-0 left-[calc(0.25rem-0.5px)] top-0 w-px bg-base group-first:top-3"
                v-if="index !== selectedOffering.offerings.length - 1"
              ></div>

              <font-awesome-icon
                icon="dot-circle"
                class="bg-lightbase absolute -left-1 top-1 rounded-full"
              />

              <div class="flex flex-col items-start">
                <span class="font-bold">{{ offering.pfiName }}</span>
                <span class="text-sm"
                  >{{ offering.payinCurrency }} →
                  {{ offering.payoutCurrency }}</span
                >
              </div>
            </li>
          </ol>
        </div>

        <div class="flex flex-col">
          <CommonAmountInput
            v-model="payinAmount"
            title="Enter amount"
            :currency="selectedOffering.payinCurrency"
            :balance="wallet?.availableBalance"
            :max="wallet?.availableBalance"
            :min="0"
            @keyup.enter="createExchange"
            v-on:input="fetchExchangeSummary"
          />
        </div>

        <div class="flex flex-col text-sm">
          <span class="border-b-[1px] border-base">Summary:</span>
          <div
            v-for="(summary, index) in summaries"
            :key="index"
            class="flex justify-between items-center border-b-[1px] border-base"
            :class="{ 'border-b-[0px]': index === summaries.length - 1 }"
          >
            <span>{{ summary.title }}:</span>
            <div class="flex flex-col text-right font-bold">
              <div
                v-if="isLoadingFetchExchangeSummary"
                class="h-2 w-24 bg-base rounded animate-pulse"
                :class="summary.values.length > 1 && 'h-6 my-2'"
              ></div>

              <span v-else v-for="(value, idx) in summary.values" :key="idx">
                {{ value }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="exchangeModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
      <CommonButton
        text="Proceed"
        @btn-action="createExchange"
        custom-css="!bg-green-600 w-full text-white"
        :loading="isLoadingCreateExchange"
      />
    </template>
  </CommonModal>
  <CommonModal
    v-if="selectedOffering"
    :open="showSuccessModal"
    title="Exchange Initiation Successful"
    @change-modal-status="
      (val) => {
        showSuccessModal = val;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4 items-center">
        <font-awesome-icon
          icon="check-circle"
          class="text-7xl text-green-600"
        />

        <div class="text-xl font-bold">
          🎉 Your exchange was successfully initiated!
        </div>
        <div>
          You have successfully created an exchange of {{}}
          <strong
            >{{ formatMoney(payinAmount) }}
            {{ selectedOffering.payinCurrency }}</strong
          >
          to
          <strong
            >{{ formatMoney(exchangeSummary?.payoutAmount) }}
            {{ selectedOffering.payoutCurrency }}</strong
          >.
        </div>
        <div class="text-sm text-left">
          Please note: Credits for exchanges typically settle into the payout
          currency within 1 to 3 minutes, which is the estimated time to process
          quotes and orders via tbDEX. Settlement may occur faster or take
          longer, depending on the number of exchange routes, as these are
          processed sequentially.
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="showSuccessModal = false"
        custom-css="bg-base w-full text-base"
      />
      <CommonButton
        text="Go to History"
        @btn-action="goToHistory"
        custom-css="!bg-green-600 w-full text-white"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { IExchange, IMatchedOffering } from "~/types/exchange";
import { useWalletStore } from "~/store/wallet";
export default defineComponent({
  props: {
    matchedOfferings: {
      type: Array as PropType<IMatchedOffering[]>,
      required: true,
    },
  },
  setup(props: { matchedOfferings: IMatchedOffering[] }) {
    const selectedOffering = ref<IMatchedOffering>();
    const exchangeModal = ref(false);
    const { $api } = useNuxtApp();
    const payinAmount = ref<number>();
    const { wallets } = storeToRefs(useWalletStore());

    const selectOffering = (offering: IMatchedOffering) => {
      selectedOffering.value = offering;
      exchangeModal.value = true;
    };

    const wallet = computed(() =>
      wallets.value.find(
        (w) => w.currency === selectedOffering.value?.payinCurrency
      )
    );
    const { withLoadingPromise } = useLoading();

    const isLoadingCreateExchange = ref(false);
    const router = useRouter();
    const showSuccessModal = ref(false);
    const createExchange = async () => {
      if (!payinAmount.value) {
        notify({
          type: "error",
          title: `invalid pay in amount inputted.`,
        });
        return;
      }
      if (selectedOffering.value && payinAmount.value) {
        await withLoadingPromise(
          $api.exchangeService
            .createExchange({
              payinAmount: payinAmount.value,
              offerings: selectedOffering.value?.offerings.map(
                (i) => i.pfiOfferingId
              ),
            })
            .then(() => {
              exchangeModal.value = false;
              showSuccessModal.value = true;
            }),
          isLoadingCreateExchange
        );
      }
    };

    const isLoadingFetchExchangeSummary = ref(false);
    const exchangeSummary = ref<IExchange>();
    const fetchExchangeSummary = async () => {
      if (!payinAmount.value) {
        notify({
          type: "error",
          title: `invalid pay in amount inputted.`,
        });
        exchangeSummary.value = null;
        return;
      }
      if (selectedOffering.value && payinAmount.value) {
        await withLoadingPromise(
          $api.exchangeService
            .fetchExchangeSummary({
              payinAmount: payinAmount.value,
              offerings: selectedOffering.value?.offerings.map(
                (i) => i.pfiOfferingId
              ),
            })
            .then((data) => {
              exchangeSummary.value = data;
            })
            .catch(() => {
              exchangeSummary.value = null;
            }),
          isLoadingFetchExchangeSummary
        );
      }
    };

    const sortMethod = ref("Highest payout");
    const reactiveMatchedOfferings = ref(props.matchedOfferings);
    const sortedMatchedOfferings = computed(() => {
      const sortMethodConfig: Record<
        string,
        { key: keyof IMatchedOffering; order: "asc" | "desc" }
      > = {
        "Highest payout": {
          key: "cumulativePayoutUnitsPerPayinUnit",
          order: "desc",
        },
        "Fastest settlement time": {
          key: "cumulativeSettlementTimeInSecs",
          order: "asc",
        },
        "Cheapest fee": { key: "cumulativeFee", order: "asc" },
      };

      const { key: sortKey, order: sortOrder } =
        sortMethodConfig[sortMethod.value] || {};

      if (!sortKey) {
        return reactiveMatchedOfferings.value;
      }

      return reactiveMatchedOfferings.value.sort((a, b) => {
        const valA = (a[sortKey] ?? 0) as number;
        const valB = (b[sortKey] ?? 0) as number;

        if (sortOrder === "asc") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
    });

    const goToHistory = () => {
      router.push({ query: { tab: "history" } });
      showSuccessModal.value = false;
    };

    const summaries = computed(() => {
      const payinCurrency = selectedOffering.value?.payinCurrency || "N/A";
      const payoutCurrency = selectedOffering.value?.payoutCurrency || "N/A";
      const cumulativePayoutUnitsPerPayinUnit =
        selectedOffering.value?.cumulativePayoutUnitsPerPayinUnit || 0;
      const cumulativeFee = selectedOffering.value?.cumulativeFee || 0;
      const platformFee = exchangeSummary.value?.platformFee || 0;
      const totalFee = exchangeSummary.value?.totalFee || 0;
      const totalPayinAmount = exchangeSummary.value?.totalPayinAmount || 0;
      const payoutAmount = exchangeSummary.value?.payoutAmount || 0;
      const cumulativeSettlementTimeInSecs =
        selectedOffering.value?.cumulativeSettlementTimeInSecs || 0;

      return [
        {
          title: "Exchange rate",
          values: [
            `1 ${payinCurrency} = ${formatMoney(
              cumulativePayoutUnitsPerPayinUnit,
              4
            )} ${payoutCurrency}`,
            `1 ${payoutCurrency} = ${formatMoney(
              1 / cumulativePayoutUnitsPerPayinUnit,
              4
            )} ${payinCurrency}`,
          ],
        },
        {
          title: "Platform fee",
          values: [`${formatMoney(platformFee)} ${payinCurrency}`],
        },
        {
          title: "PFI(s) fee",
          values: [`${formatMoney(cumulativeFee)} ${payinCurrency}`],
        },
        {
          title: "Total fee",
          values: [`${formatMoney(totalFee)} ${payinCurrency}`],
        },
        {
          title: "You will be debited",
          values: [`${formatMoney(totalPayinAmount)} ${payinCurrency}`],
        },
        {
          title: "You will receive",
          values: [`${formatMoney(payoutAmount)} ${payoutCurrency}`],
        },
        {
          title: "Estimated settlement time",
          values: [
            `${convertTime(
              cumulativeSettlementTimeInSecs,
              "seconds",
              "hours"
            )} Hours`,
          ],
        },
      ];
    });
    return {
      selectedOffering,
      exchangeModal,
      payinAmount,
      isLoadingCreateExchange,
      selectOffering,
      createExchange,
      wallet,
      goToHistory,
      showSuccessModal,
      sortMethod,
      sortedMatchedOfferings,
      exchangeSummary,
      fetchExchangeSummary,
      summaries,
      isLoadingFetchExchangeSummary,
    };
  },
});
</script>
