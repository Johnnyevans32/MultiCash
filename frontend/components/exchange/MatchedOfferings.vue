<template>
  <div class="flex flex-col text-left">
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
            >Cumulative Fee: {{ formatMoney(matchedOffering.cumulativeFee) }}
            {{ matchedOffering.payinCurrency }}</span
          >
        </div>

        <!-- Offerings Chain (from pay-in to pay-out) -->
        <div class="flex items-center gap-4">
          <div
            v-for="(offering, offeringIndex) in matchedOffering.offerings"
            :key="offering.id"
            class="flex items-center"
          >
            <!-- Offering Info -->
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

            <!-- Arrow Between Offerings -->
            <div v-if="offeringIndex < matchedOffering.offerings.length - 1">
              <span class="text-gray-400">→</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cumulative Payout -->
      <div class="text-right text-green-600 font-bold">
        Route Rate: 1
        {{ matchedOffering.payinCurrency }} =
        {{ formatMoney(matchedOffering.cumulativePayoutUnitsPerPayinUnit, 5) }}
        {{ matchedOffering.payoutCurrency }}
      </div>
    </div>
  </div>

  <CommonModal
    v-if="selectedOffering"
    :open="exchangeModal"
    title="Swap Summary"
    @change-modal-status="
      (val) => {
        exchangeModal = val;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <!-- Selected Offering Chain -->
        <div class="flex flex-col gap-2">
          <span class="font-bold">Selected Exchange Route:</span>
          <div class="flex items-center gap-4">
            <div
              v-for="(offering, index) in selectedOffering.offerings"
              :key="offering.id"
              class="flex items-center"
            >
              <div class="flex flex-col items-center">
                <span class="font-bold">{{ offering.pfiName }}</span>
                <span class="text-sm"
                  >{{ offering.payinCurrency }} →
                  {{ offering.payoutCurrency }}</span
                >
              </div>
              <div v-if="index < selectedOffering.offerings.length - 1">
                <span class="text-gray-400">→</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input for Amount -->
        <div class="flex flex-col">
          <label for="amount"
            >Enter Amount ({{
              selectedOffering.offerings[0].payinCurrency
            }}):</label
          >
          <input
            v-model="payinAmount"
            type="number"
            min="0"
            id="amount"
            class="p-2 border-[1px] border-base rounded-lg"
          />
        </div>

        <!-- Swap Summary -->
        <div class="flex flex-col">
          <span>Summary:</span>
          <div class="flex justify-between">
            <span>You will receive:</span>
            <span class="font-bold"
              >{{ calculatedPayoutAmount }}
              {{ selectedOffering.payoutCurrency }}</span
            >
          </div>
          <div class="flex justify-between text-sm">
            <span>Total Fees:</span>
            <span
              >{{ formatMoney(selectedOffering.cumulativeFee) }}
              {{ selectedOffering.payinCurrency }}</span
            >
          </div>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Proceed"
        @btn-action="createExchange"
        custom-css="bg-green-500 w-full text-white"
        :loading="isLoadingCreateExchange"
      />
      <CommonButton
        text="Cancel"
        @btn-action="exchangeModal = false"
        custom-css="bg-red-400 w-full text-black"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { IMatchedOffering } from "~/types/exchange";

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

    const selectOffering = (offering: IMatchedOffering) => {
      selectedOffering.value = offering;
      exchangeModal.value = true;
    };

    const calculatedPayoutAmount = () =>
      payinAmount.value ||
      0 * (selectedOffering.value?.cumulativePayoutUnitsPerPayinUnit || 0);

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
    };
  },
});
</script>
