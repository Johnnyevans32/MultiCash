<template>
  <div class="flex items-center justify-between">
    <h1 class="md:block hidden text-xl font-bold">Exchanges</h1>
  </div>

  <div>
    <font-awesome-icon class="text-7xl mb-5" icon="sack-xmark" />
    <p>Nothing to see here</p>
    <p>your currency exchanges will appear here once they arrive.</p>
  </div>
</template>

<script lang="ts">
import { useWalletStore } from "~/store/wallet";

export default defineComponent({
  async setup() {
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
    return {};
  },
});
</script>
