<template>
  <div class="flex flex-col gap-2 text-left">
    <span>Select your prefered exchange route:</span>
    <div
      v-for="(matchedOffering, index) in matchedOfferings"
      :key="index"
      class="cursor-pointer py-4 px-5 flex flex-col gap-4 rounded-xl bg-lightbase border-[1px] border-base md:text-sm text-xs"
      @click="selectOffering(matchedOffering)"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-bold">Route {{ index + 1 }}</span>
          <div class="flex gap-2">
            <span
              v-if="matchedOffering.id === cheapestOffering.id"
              class="md:text-xs text-tiny bg-blue-100 text-blue-700 py-1 px-2 rounded"
            >
              Cheapest
            </span>

            <span
              v-if="matchedOffering.id === fastestOffering.id"
              class="md:text-xs text-tiny bg-red-100 text-red-700 py-1 px-2 rounded"
            >
              Fastest
            </span>
            <span
              v-if="matchedOffering.id === highestPayoutOffering.id"
              class="md:text-xs text-tiny bg-green-100 text-green-700 py-1 px-2 rounded"
            >
              Highest Payout
            </span>
          </div>

          <span
            >Cumulative PFI fee:
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
              <span
                >{{ offering.payinCurrency }} →
                {{ offering.payoutCurrency }}</span
              >
              <span class="text-xs"
                >1 {{ offering.payinCurrency }} =
                {{ offering.payoutUnitsPerPayinUnit }}
                {{ offering.payoutCurrency }}</span
              >
            </div>

            <div v-if="offeringIndex < matchedOffering.offerings.length - 1">
              <span>→</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span
          >Estimated settlement time:

          {{
            convertTime(
              matchedOffering.cumulativeSettlementTimeInSecs,
              "seconds",
              "hours"
            )
          }}
          Hours</span
        >
        <div class="text-green-600 font-bold">
          Exchange rate: 1
          {{ matchedOffering.payinCurrency }} =
          {{
            formatMoney(matchedOffering.cumulativePayoutUnitsPerPayinUnit, 5)
          }}
          {{ matchedOffering.payoutCurrency }}
        </div>
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
            :balance="wallet?.availableBalance"
            :max="wallet?.availableBalance"
            :min="0"
            @keyup.enter="createExchange"
          />
        </div>

        <div class="flex flex-col text-sm">
          <span class="border-b-[1px] border-base">Summary:</span>

          <div class="flex justify-between border-b-[1px] border-base">
            <span>Exchange rate:</span>
            <span class="font-bold"
              >1 {{ selectedOffering.payinCurrency }} =
              {{
                formatMoney(
                  selectedOffering.cumulativePayoutUnitsPerPayinUnit,
                  5
                )
              }}
              {{ selectedOffering.payoutCurrency }} or 1
              {{ selectedOffering.payoutCurrency }} =
              {{
                formatMoney(
                  1 / selectedOffering.cumulativePayoutUnitsPerPayinUnit,
                  5
                )
              }}
              {{ selectedOffering.payinCurrency }}
            </span>
          </div>
          <div class="flex justify-between border-b-[1px] border-base">
            <span>Platform fee:</span>
            <span class="font-bold"
              >{{ formatMoney(calculatedPlatformFeeAmount) }}
              {{ selectedOffering.payinCurrency }}
            </span>
          </div>
          <div class="flex justify-between border-b-[1px] border-base">
            <span>PFI(s) fee:</span>
            <span class="font-bold"
              >{{ formatMoney(selectedOffering.cumulativeFee) }}
              {{ selectedOffering.payinCurrency }}</span
            >
          </div>
          <div class="flex justify-between border-b-[1px] border-base">
            <span>Total fee:</span>
            <span class="font-bold"
              >{{
                formatMoney(
                  selectedOffering.cumulativeFee + calculatedPlatformFeeAmount
                )
              }}
              {{ selectedOffering.payinCurrency }}</span
            >
          </div>
          <div class="flex justify-between border-b-[1px] border-base">
            <span>You will receive:</span>
            <span class="font-bold"
              >{{ formatMoney(calculatedPayoutAmount) }}
              {{ selectedOffering.payoutCurrency }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>Estimated settlement time:</span>
            <span class="font-bold">
              {{
                convertTime(
                  selectedOffering.cumulativeSettlementTimeInSecs,
                  "seconds",
                  "hours"
                )
              }}
              Hours</span
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
  <CommonModal
    :open="showSuccessModal"
    title="Exchange Successful"
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
          <strong>{{ selectedOffering.payoutCurrency }}</strong
          >.
        </div>
        <div class="text-sm text-gray-600 text-center mt-4">
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
import type { IMatchedOffering } from "~/types/exchange";
import { useWalletStore } from "~/store/wallet";
export default defineComponent({
  props: {
    matchedOfferings: {
      type: Array as PropType<IMatchedOffering[]>,
      required: true,
    },
  },
  setup(props) {
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
    const walletCurrency = computed(() => wallet.value?.walletCurrency);

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
    const router = useRouter();
    const showSuccessModal = ref(false);
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
              showSuccessModal.value = true;
              notify({
                type: "success",
                title: `exchange is being processed`,
              });
            }),
          isLoadingCreateExchange
        );
      }
    };

    const cheapestOffering = computed(() => {
      return props.matchedOfferings.reduce((prev, curr) =>
        prev.cumulativeFee < curr.cumulativeFee ? prev : curr
      );
    });

    const fastestOffering = computed(() => {
      return props.matchedOfferings.reduce((prev, curr) =>
        prev.cumulativeSettlementTimeInSecs <
        curr.cumulativeSettlementTimeInSecs
          ? prev
          : curr
      );
    });
    const highestPayoutOffering = computed(() => {
      return props.matchedOfferings.reduce((prev, curr) =>
        prev.cumulativePayoutUnitsPerPayinUnit >
        curr.cumulativePayoutUnitsPerPayinUnit
          ? prev
          : curr
      );
    });

    const goToHistory = () => {
      router.push({ query: { tab: "history" } });
      showSuccessModal.value = false;
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
      wallet,
      fastestOffering,
      cheapestOffering,
      highestPayoutOffering,
      goToHistory,
      showSuccessModal,
    };
  },
});
</script>
