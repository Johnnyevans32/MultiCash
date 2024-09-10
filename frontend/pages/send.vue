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

  <div v-if="isFetchBenefiariesLoading">
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
      <div class="h-2 w-12 bg-base rounded"></div>
    </div>
  </div>
  <div v-else-if="!benefiaries.length">
    <font-awesome-icon class="text-7xl mb-5" icon="university" />
    <p>Nothing to see here</p>
    <p>your benefiary bank accounts will appear here once added.</p>
  </div>
  <div v-else class="flex flex-col gap-2">
    <div
      v-for="benefiary in benefiaries"
      :key="benefiary.id"
      class="cursor-pointer py-5 md:px-5 px-2 flex items-center h-16 justify-between rounded-xl bg-lightbase"
      @click="openWithdrawalModal(benefiary)"
    >
      <div class="flex space-x-3 items-center">
        <CommonImage
          :image="
            benefiary.type === 'platform'
              ? benefiary.beneficiaryUser.profileImage
              : benefiary.bank.logo
          "
          :alt="
            benefiary.type === 'platform'
              ? benefiary.beneficiaryUser.tag
              : benefiary.bank.name
          "
        />

        <div class="flex flex-col text-left">
          <span class="md:text-sm text-xs line-clamp-1">{{
            benefiary.type === "platform"
              ? benefiary.beneficiaryUser.name
              : benefiary.accountName
          }}</span>
          <span class="md:text-sm text-xs line-clamp-1">{{
            benefiary.type === "platform"
              ? `@${benefiary.beneficiaryUser.tag}`
              : `${benefiary.accountNumber} (${benefiary.bank.name})`
          }}</span>
        </div>
      </div>
      <font-awesome-icon icon="arrow-right" />
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
          title="Select benefiary type"
          :selected="benefiaryType"
          :options="['platform', 'bankacccount']"
          @change-option="
            (val) => {
              benefiaryType = val;
            }
          "
        />
        <CommonFormSelect
          v-if="benefiaryType === 'bankacccount'"
          title="Select currency"
          :selected="selectedCurrency"
          :options="withdrawableCurrencies"
          @change-option="handleCurrencyChange"
        />
        <CommonFormSelect
          v-if="benefiaryType === 'bankacccount'"
          title="Select bank"
          :selected="selectedBankId"
          :options="groupedBanksByCurrency[selectedCurrency]"
          @change-option="handleBankChange"
          labelKey="name"
          placeholder="-- Please select a bank --"
          valueKey="id"
        />
        <CommonFormInput
          v-if="benefiaryType === 'bankacccount'"
          v-model="accountNumber"
          placeholder="Enter account number"
          title="Enter account number"
          input-type="text"
        />
        <CommonFormInput
          v-if="benefiaryType === 'platform'"
          v-model="benefiaryTag"
          placeholder="Enter user tag"
          title="Enter user tag"
          input-type="text"
        />
        <span v-if="accountName" class="text-sm text-red-600"
          >Account Name: {{ accountName }}</span
        >
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="addAccountModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
      <CommonButton
        text="Add benefiary"
        @btn-action="createBenefiary"
        custom-css="!bg-blue-600 w-full text-white"
        :loading="isCreateBenefiaryLoading"
      />
    </template>
  </CommonModal>

  <CommonModal
    :open="withdrawalModal"
    title="Send money to benefiary"
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
            {{ selectedBenefiary?.accountName }}
          </p>
        </div>

        <div>
          <span class="text-sm">Benefiary Account Number:</span>
          <p class="md:text-sm text-xs">
            {{ selectedBenefiary?.accountNumber }}
          </p>
        </div>

        <div>
          <span class="text-sm">Benefiary Bank Name:</span>
          <p class="md:text-sm text-xs">
            {{ selectedBenefiary?.bank.name }}
          </p>
        </div>

        <CommonAmountInput
          v-model="amount"
          placeholder="Enter amount"
          title="Enter amount"
          :currency="selectedBenefiary?.bank.currency"
          :balance="wallet?.availableBalance"
          :max="wallet?.availableBalance"
          :min="0"
        />

        <CommonFormInput
          inputType="password"
          v-model="password"
          title="Enter your password"
          placeholder="password"
        />
        <CommonTextArea
          v-model="note"
          placeholder="Add note"
          title="Add note"
        />
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="withdrawalModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
      <CommonButton
        text="Send"
        @btn-action="withdraw"
        custom-css="!bg-blue-600 w-full text-white"
        :loading="isWithdrawLoading"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useWalletStore } from "~/store/wallet";
import type { IBenefiary } from "~/types/wallet";

export default defineComponent({
  async setup() {
    useSeoMeta({
      title: "Send",
      ogTitle: "Send",
    });
    onBeforeMount(async () => {
      await Promise.all([fetchBanks(), fetchWallets(), fetchBenefiaries()]);
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
        .filter((w) => w.walletCurrency.withdrawalEnabled)
        .map((i) => i.currency)
    );

    const selectedCurrency = ref("");

    const wallet = computed(() =>
      wallets.value.find((w) => w.currency === selectedCurrency.value)
    );

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

    const benefiaryType = ref<"bankacccount" | "platform">("bankacccount");
    const benefiaryTag = ref();
    const isCreateBenefiaryLoading = ref(false);
    const accountName = ref("");
    const createBenefiary = async () => {
      await withLoadingPromise(
        $api.paymentService
          .verifyAccountNumber({
            accountNumber: accountNumber.value,
            bankId: selectedBankId.value,
          })
          .then(async (resp: { accountName: string }) => {
            accountName.value = resp.accountName;
            await $api.walletService.createBenefiary({
              accountNumber: accountNumber.value,
              accountName: resp.accountName,
              bank: selectedBankId.value,
              benefiaryType: benefiaryType.value,
              benefiaryTag: benefiaryTag.value,
            });
            addAccountModal.value = false;
            fetchBenefiaries();
            notify({
              type: "success",
              title: "benefiary created",
            });
          }),
        isCreateBenefiaryLoading
      );
    };

    const handleCurrencyChange = (newVal: string) => {
      selectedCurrency.value = newVal;
    };
    const handleBankChange = (newVal: string) => {
      selectedBankId.value = newVal;
    };

    const benefiaries = ref<IBenefiary[]>([]);
    const isFetchBenefiariesLoading = ref(false);
    const fetchBenefiaries = async () => {
      await withLoadingPromise(
        $api.walletService.fetchBenefiaries().then((resp) => {
          benefiaries.value = resp;
        }),
        isFetchBenefiariesLoading
      );
    };

    const fetchBanks = async () => {
      const banks = await $api.paymentService.fetchBanks();
      setBanks(banks);
    };

    const note = ref("");
    const amount = ref(100);
    const selectedBenefiary = ref<IBenefiary>();
    const password = ref("");
    const isWithdrawLoading = ref(false);

    const withdraw = async () => {
      if (!selectedBenefiary.value) {
        return;
      }
      await withLoadingPromise(
        $api.walletService
          .withdraw({
            note: note.value,
            amount: amount.value,
            benefiary: selectedBenefiary.value?.id,
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
    const openWithdrawalModal = (_selectedBenefiary: IBenefiary) => {
      selectedBenefiary.value = _selectedBenefiary;
      withdrawalModal.value = true;
    };

    return {
      selectedCurrency,
      accountNumber,
      addAccountModal,
      createBenefiary,
      groupedBanksByCurrency,
      withdrawableCurrencies,
      handleCurrencyChange,
      isFetchWalletLoading,
      selectedBankId,
      handleBankChange,
      isCreateBenefiaryLoading,
      isFetchBenefiariesLoading,
      benefiaries,
      withdrawalModal,
      selectedBenefiary,
      amount,
      note,
      password,
      isWithdrawLoading,
      withdraw,
      openWithdrawalModal,
      wallet,
      accountName,
      benefiaryType,
      benefiaryTag,
    };
  },
});
</script>
