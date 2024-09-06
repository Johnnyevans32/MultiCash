<template>
  <div class="flex flex-col gap-4">
    <CommonFormSelect
      title="Choose Pay In Currency"
      :selected="payinCurrency"
      :options="payinOptions"
      @change-option="
        (newValue) => {
          payinCurrency = newValue;
        }
      "
      placeholder="-- Please choose the currency you want to convert from --"
    />

    <!-- <div
      class="text-2xl bg-blue-600 p-5 h-10 w-10 flex justify-center items-center rounded-full text-white self-center"
      @click="switchCurrencies"
    >
      <font-awesome-icon icon="fa-solid fa-retweet" />
    </div> -->

    <CommonFormSelect
      title="Choose Pay Out Currency"
      :selected="payoutCurrency"
      :options="payoutOptions"
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
      <div class="h-2 w-28 bg-base rounded mb-2"></div>
      <div
        v-for="i in 2"
        :key="i"
        class="cursor-progress p-5 flex mb-2 items-center h-32 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
      ></div>
    </div>
    <ExchangeMatchedOfferings
      v-else-if="!isLoadingOfferings && matchedOfferings.length"
      :matchedOfferings="matchedOfferings"
    />
    <div v-else>
      <font-awesome-icon class="text-7xl mb-5" icon="box-open" />
      <p>No matched offerings found as of now</p>
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

    const payinOptions = computed(() =>
      wallets.value
        .map((i: { currency: string }) => i.currency)
        .filter((currency) => currency !== payoutCurrency.value)
    );
    const payoutOptions = computed(() =>
      wallets.value
        .map((i: { currency: string }) => i.currency)
        .filter((currency) => currency !== payinCurrency.value)
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

    const switchCurrencies = () => {
      const temp = payinCurrency.value;
      payinCurrency.value = payoutCurrency.value;
      payoutCurrency.value = temp;
    };

    return {
      payinCurrency,
      payoutCurrency,
      payinOptions,
      payoutOptions,
      isLoadingWallets,
      getOfferings,
      isLoadingOfferings,
      switchCurrencies,
      matchedOfferings,
    };
  },
});
</script>
