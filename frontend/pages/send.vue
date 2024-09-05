<template>
  <div class="border-b-[1px] border-base text-left py-2">
    <CommonPageBar mainPage="Send" />
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold">Benefiaries</h1>
    <CommonButton
      v-if="!isFetchWalletLoading"
      text="Add Benefiary"
      imageType="icon"
      image="fa-solid fa-plus"
      @btn-action="addAccountModal = true"
      customCss="justify-self-end"
    />
  </div>

  <div v-if="isFetchWalletAccountLoading">
    <div
      v-for="i in 2"
      :key="i"
      class="p-5 cursor-progress flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
    >
      <div class="flex space-x-2 items-center">
        <div class="bg-base h-10 w-10 rounded-xl"></div>

        <div class="flex flex-col gap-2">
          <div class="h-2 w-20 bg-base rounded"></div>
          <div class="h-2 w-28 bg-base rounded"></div>
        </div>
      </div>
      <div class="h-2 w-28 bg-base rounded"></div>
    </div>
  </div>
  <div v-else-if="!walletAccounts.length">
    <font-awesome-icon class="text-7xl mb-5" icon="university" />
    <p>Nothing to see here</p>
    <p>your benefiary bank accounts will appear here once added.</p>
  </div>
  <div v-else class="flex flex-col gap-2">
    <div
      v-for="account in walletAccounts"
      :key="account.id"
      class="cursor-pointer py-5 md:px-5 px-2 flex items-center h-16 justify-between rounded-xl bg-lightbase"
      @click="openWithdrawalModal(account)"
    >
      <div class="flex space-x-3 items-center">
        <CommonImage :image="account.bank.logo" :alt="account.bank.name" />

        <div class="flex flex-col text-left">
          <span class="md:text-sm text-xs">{{ account.accountName }}</span>
          <span class="md:text-sm text-xs"
            >{{ account.accountNumber }} ({{ account.bank.name }})</span
          >
        </div>
      </div>
      <span class="text-sm">{{ account.bank.currency }}</span>
    </div>
  </div>
  <CommonModal
    :open="addAccountModal"
    title="Add a beneficiary account"
    @change-modal-status="
      (value) => {
        addAccountModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <CommonFormSelect
          title="Select currency"
          :selected="selectedCurrency"
          :options="withdrawableCurrencies"
          @change-option="handleCurrencyChange"
        />
        <CommonFormSelect
          title="Select bank"
          :selected="selectedBankId"
          :options="groupedBanksByCurrency[selectedCurrency]"
          @change-option="handleBankChange"
          labelKey="name"
          placeholder="-- Please select a bank --"
          valueKey="id"
        />
        <CommonFormInput
          v-model="accountNumber"
          placeholder="Enter account number"
          title="Enter account number"
          input-type="text"
        />
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="addAccountModal = false"
        custom-css="bg-red-400 w-full text-black"
      />
      <CommonButton
        text="Add account"
        @btn-action="createWalletAccount"
        custom-css="!bg-blue-400 w-full text-black"
        :loading="isCreateWalletLoading"
      />
    </template>
  </CommonModal>

  <CommonModal
    :open="withdrawalModal"
    title="Withdraw from wallet"
    @change-modal-status="
      (value) => {
        withdrawalModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-sm">Benefiary Account Name:</span>
          <p class="md:text-sm text-xs">
            {{ selectedWalletAccount?.accountName }}
          </p>
        </div>

        <div>
          <span class="text-sm">Benefiary Account Number:</span>
          <p class="md:text-sm text-xs">
            {{ selectedWalletAccount?.accountNumber }}
          </p>
        </div>

        <div>
          <span class="text-sm">Benefiary Bank Name:</span>
          <p class="md:text-sm text-xs">
            {{ selectedWalletAccount?.bank.name }}
          </p>
        </div>

        <CommonAmountInput
          v-model="amount"
          placeholder="Enter amount"
          title="Enter amount"
          :currency="selectedWalletAccount?.bank.currency"
        />
        <CommonFormInput
          v-model="note"
          placeholder="What is it for?"
          title="What is it for?"
          inputType="text"
        />
        <CommonFormInput
          inputType="password"
          v-model="password"
          title="Enter your password"
          placeholder="password"
        />
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="withdrawalModal = false"
        custom-css="bg-red-400 w-full text-black"
      />
      <CommonButton
        text="Send"
        @btn-action="withdraw"
        custom-css="!bg-blue-400 w-full text-black"
        :loading="isWithdrawLoading"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useWalletStore } from "~/store/wallet";
import type { IWallet, IWalletAccount } from "~/types/wallet";

export default defineComponent({
  async setup() {
    onBeforeMount(async () => {
      await Promise.all([fetchBanks(), fetchWallets(), fetchWalletAccounts()]);
    });

    const { $api } = useNuxtApp();
    const addAccountModal = ref(false);
    const accountNumber = ref("");

    const { banks, wallets } = storeToRefs(useWalletStore());
    const { setWallets, setBanks } = useWalletStore();
    const selectedBankId = ref("");
    const { withLoadingPromise } = useLoading();
    const groupedBanksByCurrency = computed(() =>
      groupBy(banks.value, "currency")
    );
    const withdrawableCurrencies = computed(() =>
      wallets.value
        .filter((w: IWallet) => w.walletCurrency.withdrawalEnabled)
        .map((i: { currency: string }) => i.currency)
    );
    const selectedCurrency = ref("");

    const isFetchWalletLoading = ref(false);
    const fetchWallets = async () => {
      await withLoadingPromise(
        $api.walletService.fetchWallets().then((resp) => {
          selectedCurrency.value = resp.filter(
            (w) => w.walletCurrency.withdrawalEnabled
          )[0].currency;
          setWallets(resp);
        }),
        isFetchWalletLoading
      );
    };

    const isCreateWalletLoading = ref(false);
    const createWalletAccount = async () => {
      await withLoadingPromise(
        $api.paymentService
          .verifyAccountNumber({
            accountNumber: accountNumber.value,
            bankId: selectedBankId.value,
          })
          .then(async (resp: { accountName: string }) => {
            await $api.walletService.createWalletAccount({
              accountNumber: accountNumber.value,
              accountName: resp.accountName,
              bank: selectedBankId.value,
            });
            addAccountModal.value = false;
            fetchWalletAccounts();
            notify({
              type: "success",
              title: "account created",
            });
          }),
        isCreateWalletLoading
      );
    };

    const handleCurrencyChange = (newVal: string) => {
      selectedCurrency.value = newVal;
    };
    const handleBankChange = (newVal: string) => {
      selectedBankId.value = newVal;
    };

    const walletAccounts = ref<IWalletAccount[]>([]);
    const isFetchWalletAccountLoading = ref(false);
    const fetchWalletAccounts = async () => {
      await withLoadingPromise(
        $api.walletService.fetchWalletAccounts().then((resp) => {
          walletAccounts.value = resp;
        }),
        isFetchWalletAccountLoading
      );
    };

    const fetchBanks = async () => {
      const banks = await $api.paymentService.fetchBanks();
      setBanks(banks);
    };

    const note = ref("");
    const amount = ref(100);
    const selectedWalletAccount = ref<IWalletAccount>();
    const password = ref("");
    const isWithdrawLoading = ref(false);
    const withdraw = async () => {
      if (!selectedWalletAccount.value) {
        return;
      }
      await withLoadingPromise(
        $api.walletService
          .withdraw({
            note: note.value,
            amount: amount.value,
            walletAccount: selectedWalletAccount.value?.id,
            password: password.value,
          })
          .then(() => {
            withdrawalModal.value = false;
            notify({
              type: "success",
              title: "withdraw successful",
            });
          }),
        isWithdrawLoading
      );
    };

    const withdrawalModal = ref(false);
    const openWithdrawalModal = (_selectedAccount: IWalletAccount) => {
      selectedWalletAccount.value = _selectedAccount;
      withdrawalModal.value = true;
    };

    return {
      selectedCurrency,
      accountNumber,
      addAccountModal,
      createWalletAccount,
      groupedBanksByCurrency,
      withdrawableCurrencies,
      handleCurrencyChange,
      isFetchWalletLoading,
      selectedBankId,
      handleBankChange,
      isCreateWalletLoading,
      isFetchWalletAccountLoading,
      walletAccounts,
      withdrawalModal,
      selectedWalletAccount,
      amount,
      note,
      password,
      isWithdrawLoading,
      withdraw,
      openWithdrawalModal,
    };
  },
});
</script>
