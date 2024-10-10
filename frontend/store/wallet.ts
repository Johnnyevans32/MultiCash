import type { IWallet, IBank } from "~/types/wallet";

export const useWalletStore = defineStore("walletStore", () => {
  const wallets = ref<IWallet[]>([]);
  const banks = ref<IBank[]>([]);

  function setWallets(data: IWallet[]) {
    wallets.value = data;
  }
  function setBanks(data: IBank[]) {
    banks.value = data;
  }

  function resetStore() {
    wallets.value = [];
    banks.value = [];
  }

  return {
    wallets,
    banks,
    setWallets,
    setBanks,
    resetStore,
  };
});
