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
  </div>
</template>

<script lang="ts">
import { useWalletStore } from "~/store/wallet";

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
        $api.walletService.fetchWallets().then((walletsResponse: any) => {
          setWallets(walletsResponse);
        }),
        isLoadingWallets
      );
    };

    const offerings = ref([]);
    const isLoadingOfferings = ref(false);
    const getOfferings = async () => {
      await withLoadingPromise(
        $api.exchangeService
          .getOfferings(payinCurrency.value, payoutCurrency.value)
          .then((resp: any) => {
            offerings.value = resp;
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
    };
  },
});
</script>
