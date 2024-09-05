<template>
  <div>
    <font-awesome-icon class="text-7xl mb-5" icon="sack-xmark" />
    <p>Table</p>
  </div>
</template>
<script lang="ts">
import { useWalletStore } from "~/store/wallet";

export default defineComponent({
  setup() {
    const config = useRuntimeConfig();
    const { $api } = useNuxtApp();
    const { wallets } = storeToRefs(useWalletStore());
    const { setWallets } = useWalletStore();
    const { withLoadingPromise } = useLoading();

    onBeforeMount(async () => {
      await fetchWallets();
    });
    const walletCurrencies = computed(() =>
      wallets.value.map((i: { currency: string }) => i.currency)
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
    return { config };
  },
});
</script>
