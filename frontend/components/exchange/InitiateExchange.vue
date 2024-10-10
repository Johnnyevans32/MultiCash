<template>
  <div class="flex flex-col gap-4">
    <CommonFormSelect
      title="Choose Pay In Currency"
      :selected="payinCurrency"
      :options="exchangeCurrencies"
      @change-option="
        (newValue) => {
          payinCurrency = newValue;
        }
      "
      placeholder="-- Please choose the currency you want to convert from --"
    />

    <CommonFormSelect
      title="Choose Pay Out Currency"
      :selected="payoutCurrency"
      :options="exchangeCurrencies"
      @change-option="
        (newValue) => {
          payoutCurrency = newValue;
        }
      "
      placeholder="-- Please choose the currency you want to convert to --"
    />

    <CommonButton
      text="Get Offerings"
      @btn-action="getOfferings"
      :loading="isLoadingOfferings"
      custom-css="!bg-blue-600 w-full text-white"
    />

    <div v-if="isLoadingOfferings">
      <div class="flex justify-between items-center">
        <div class="h-2 w-28 bg-base rounded mb-2"></div>

        <div class="h-4 w-28 bg-base rounded mb-2"></div>
      </div>
      <div
        v-for="i in 2"
        :key="i"
        class="cursor-progress p-5 flex mb-2 items-center h-24 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
      ></div>
    </div>
    <ExchangeMatchedOfferings
      v-else-if="!isLoadingOfferings && matchedOfferings.length"
      :matchedOfferings="matchedOfferings"
    />
    <div v-else>
      <font-awesome-icon class="text-7xl mb-5" icon="box-open" />
      <p>No matched offerings found yet</p>
    </div>
  </div>
</template>

<script lang="ts">
import { useWalletStore } from "~/store/wallet";
import type { IMatchedOffering } from "~/types/exchange";

export default defineComponent({
  setup() {
    const { $api } = useNuxtApp();
    const { wallets } = storeToRefs(useWalletStore());
    const { setWallets } = useWalletStore();
    const { withLoadingPromise } = useLoading();

    onBeforeMount(async () => {
      await fetchWallets();
    });

    const payinCurrency = ref("");
    const payoutCurrency = ref("");

    const exchangeCurrencies = computed(() =>
      wallets.value.map((i: { currency: string }) => i.currency)
    );

    const isLoadingWallets = ref(false);
    const fetchWallets = async () => {
      await withLoadingPromise(
        $api.walletService.fetchWallets().then((walletsResponse) => {
          setWallets(walletsResponse);
        }),
        isLoadingWallets
      );
    };

    const matchedOfferings = ref<IMatchedOffering[]>([]);
    const isLoadingOfferings = ref(false);
    const getOfferings = async () => {
      await withLoadingPromise(
        $api.exchangeService
          .getOfferings(payinCurrency.value, payoutCurrency.value)
          .then((resp) => {
            matchedOfferings.value = resp;
          }),
        isLoadingOfferings
      );
    };

    return {
      payinCurrency,
      payoutCurrency,
      exchangeCurrencies,
      isLoadingWallets,
      getOfferings,
      isLoadingOfferings,
      matchedOfferings,
    };
  },
});
</script>
