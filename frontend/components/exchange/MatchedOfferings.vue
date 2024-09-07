<template>
  <div class="flex flex-col gap-2 text-left">
    <span>Select your prefered exchange route:</span>
    <div
      v-for="(matchedOffering, index) in matchedOfferings"
      :key="index"
      class="cursor-pointer py-4 px-5 flex flex-col gap-4 rounded-xl bg-lightbase border-[1px] border-base"
      @click="selectOffering(matchedOffering)"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-bold">Route {{ index + 1 }}</span>
          <span class="text-gray-600"
            >Cumulative PFI Fee:
            {{ formatMoney(matchedOffering.cumulativeFee) }}
            {{ matchedOffering.payinCurrency }}</span
          >
        </div>

        <div class="flex items-center gap-4">
          <div
            v-for="(offering, offeringIndex) in matchedOffering.offerings"
            :key="offering.id"
            class="flex items-center"
          >
            <div class="flex flex-col items-start">
              <span class="font-bold">{{ offering.pfiName }}</span>
              <span class="text-sm"
                >{{ offering.payinCurrency }} →
                {{ offering.payoutCurrency }}</span
              >
              <span class="text-xs text-gray-500"
                >1 {{ offering.payinCurrency }} =
                {{ offering.payoutUnitsPerPayinUnit }}
                {{ offering.payoutCurrency }}</span
              >
            </div>

            <div v-if="offeringIndex < matchedOffering.offerings.length - 1">
              <span class="text-gray-400">→</span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-right text-green-600 font-bold">
        Exchange Rate: 1
        {{ matchedOffering.payinCurrency }} =
        {{ formatMoney(matchedOffering.cumulativePayoutUnitsPerPayinUnit, 5) }}
        {{ matchedOffering.payoutCurrency }}
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
          <div class="flex items-center gap-4">
            <div
              v-for="(offering, index) in selectedOffering.offerings"
              :key="offering.id"
              class="flex items-center gap-2"
            >
              <div class="flex flex-col items-start">
                <span class="font-bold">{{ offering.pfiName }}</span>
                <span class="text-sm"
                  >{{ offering.payinCurrency }} →
                  {{ offering.payoutCurrency }}</span
                >
              </div>
              <div v-if="index < selectedOffering.offerings.length - 1">
                <span> → </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <CommonAmountInput
            v-model="payinAmount"
            placeholder="Enter amount"
            title="Enter amount"
            :currency="selectedOffering.payinCurrency"
          />
        </div>

        <div class="flex flex-col">
          <span>Summary:</span>

          <div class="flex justify-between">
            <span>Platform Fee:</span>
            <span class="font-bold"
              >{{ (walletCurrency?.exchangePercentageFee || 0) * 100 }}%
            </span>
          </div>
          <div class="flex justify-between">
            <span>PFI(s) Fee:</span>
            <span class="font-bold"
              >{{ formatMoney(selectedOffering.cumulativeFee) }}
              {{ selectedOffering.payinCurrency }}</span
            >
          </div>
          <div class="flex justify-between text-sm">
            <span>Total Fees:</span>
            <span
              >{{
                formatMoney(
                  selectedOffering.cumulativeFee + calculatedPlatformFeeAmount
                )
              }}
              {{ selectedOffering.payinCurrency }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>You will receive:</span>
            <span class="font-bold"
              >{{ formatMoney(calculatedPayoutAmount) }}
              {{ selectedOffering.payoutCurrency }}</span
            >
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
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { IMatchedOffering } from "~/types/exchange";
import { useWalletStore } from "~/store/wallet";
export default defineComponent({
  props: {
    matchedOfferings: {
      type: Array as PropType<IMatchedOffering[]>,
      required: true,
    },
  },
  setup() {
    const selectedOffering = ref<IMatchedOffering>();
    const exchangeModal = ref(false);
    const { $api } = useNuxtApp();
    const payinAmount = ref<number>();
    const { wallets } = storeToRefs(useWalletStore());

    const selectOffering = (offering: IMatchedOffering) => {
      selectedOffering.value = offering;
      exchangeModal.value = true;
    };

    const walletCurrency = computed(() => {
      const wallet = wallets.value.find(
        (w) => w.currency === selectedOffering.value?.payinCurrency
      );
      return wallet?.walletCurrency;
    });

    const calculatedPlatformFeeAmount = computed(() =>
      Math.min(
        (payinAmount.value || 0) *
          (walletCurrency.value?.exchangePercentageFee || 0),
        walletCurrency.value?.maxExchangeFee || 0
      )
    );
    const calculatedPayoutAmount = computed(
      () =>
        ((payinAmount.value || 0) - (calculatedPlatformFeeAmount.value || 0)) *
        (selectedOffering.value?.cumulativePayoutUnitsPerPayinUnit || 0)
    );

    const { withLoadingPromise } = useLoading();

    const isLoadingCreateExchange = ref(false);
    const createExchange = async () => {
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
              notify({
                type: "success",
                title: `exchange is being processed`,
              });
            }),
          isLoadingCreateExchange
        );
      }
    };
    return {
      selectedOffering,
      exchangeModal,
      payinAmount,
      isLoadingCreateExchange,
      selectOffering,
      createExchange,
      calculatedPayoutAmount,
      walletCurrency,
      calculatedPlatformFeeAmount,
    };
  },
});
</script>
