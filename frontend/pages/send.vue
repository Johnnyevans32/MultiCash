<template>
  <div class="border-b-[1px] border-base text-left py-2">
    <CommonPageBar mainPage="Send" />
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold">Beneficiaries</h1>
    <CommonButton
      v-if="!isFetchWalletLoading"
      text="Add Beneficiary"
      imageType="icon"
      image="fa-solid fa-plus"
      @btn-action="addAccountModal = true"
      customCss="justify-self-end"
    />
  </div>

  <div v-if="isFetchBeneficiariesLoading">
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
  <div v-else-if="!beneficiaries.length">
    <font-awesome-icon class="text-7xl mb-5" icon="user-group" />
    <p>Nothing to see here</p>
    <p>your beneficiaries will appear here once added.</p>
  </div>
  <div v-else class="flex flex-col gap-2">
    <div
      v-for="beneficiary in beneficiaries"
      :key="beneficiary.id"
      class="cursor-pointer p-5 flex items-center h-16 justify-between rounded-xl bg-lightbase"
      @click="openWithdrawalModal(beneficiary)"
    >
      <div class="flex space-x-2 items-center">
        <CommonImage
          :image="
            beneficiary.type === 'platform'
              ? beneficiary.beneficiaryUser?.profileImage
              : beneficiary.bank?.logo
          "
          :alt="
            beneficiary.type === 'platform'
              ? beneficiary.beneficiaryUser?.tag
              : beneficiary.bank?.name || beneficiary.accountName
          "
        />

        <div class="flex flex-col text-left">
          <span class="md:text-sm text-xs line-clamp-1">{{
            beneficiary.type === "platform"
              ? beneficiary?.beneficiaryUser?.name
              : beneficiary.accountName
          }}</span>
          <span class="md:text-sm text-xs line-clamp-1">{{
            beneficiary.type === "platform"
              ? `@${beneficiary?.beneficiaryUser?.tag}`
              : `${beneficiary.accountNumber} ${
                  beneficiary.bank
                    ? `(${beneficiary.bank?.name})`
                    : `(${beneficiary.currency} account)`
                }`
          }}</span>
        </div>
      </div>
      <font-awesome-icon icon="arrow-right" />
    </div>
  </div>
  <CommonModal
    :open="addAccountModal"
    title="Add a beneficiary"
    @change-modal-status="
      (value) => {
        addAccountModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <CommonFormSelect
          title="Select beneficiary type"
          :selected="beneficiaryType"
          :options="['platform', 'bank_account']"
          @change-option="
            (val) => {
              beneficiaryType = val;
            }
          "
        />
        <div
          v-if="beneficiaryType === 'bank_account'"
          class="flex flex-col gap-4"
        >
          <CommonFormSelect
            title="Select currency"
            :selected="selectedCurrency"
            :options="withdrawableCurrencies"
            @change-option="handleCurrencyChange"
            placeholder="-- Please select a currency --"
          />
          <CommonFormSelect
            title="Select bank"
            v-if="isAfricanCurrency(selectedCurrency)"
            :selected="selectedBankId"
            :options="groupedBanksByCurrency[selectedCurrency]"
            @change-option="handleBankChange"
            labelKey="name"
            placeholder="-- Please select a bank --"
            valueKey="id"
          />

          <CommonFormInput
            v-model="bankCode"
            v-if="isInternationalCurrency(selectedCurrency)"
            placeholder="1234567890"
            :title="`Enter ${bankCodeNamesByCurrency[selectedCurrency]}`"
            input-type="text"
          />

          <CommonFormInput
            v-model="accountName"
            v-if="
              isInternationalCurrency(selectedCurrency) ||
              isCryptoCurrency(selectedCurrency)
            "
            placeholder="Mark Smith"
            title="Enter Beneficiary Name"
            input-type="text"
          />

          <CommonFormInput
            v-model="accountNumber"
            placeholder="1234567890"
            :title="`Enter ${
              accountNumberNamesByCurrency[selectedCurrency] || 'Account Number'
            }`"
            input-type="text"
            @keyup.enter="
              isAfricanCurrency(selectedCurrency) && verifyAccountNumber
            "
            :validationMessage="
              !isAfricanCurrency(selectedCurrency)
                ? ''
                : isVerifyAccountNumberLoading
                ? 'Validating account details...'
                : accountName
            "
            :isErrorMessage="false"
          />
        </div>
        <CommonFormInput
          v-if="beneficiaryType === 'platform'"
          v-model="beneficiaryTag"
          placeholder="Enter user tag (e.g., john_doe)"
          title="Enter user tag"
          input-type="text"
          @keyup.enter="createBeneficiary"
        />
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="addAccountModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
      <CommonButton
        text="Add beneficiary"
        @btn-action="createBeneficiary"
        custom-css="!bg-blue-600 w-full text-white"
        :loading="isCreateBeneficiaryLoading || isVerifyAccountNumberLoading"
      />
    </template>
  </CommonModal>

  <CommonModal
    :open="withdrawalModal"
    title="Send money to beneficiary"
    @change-modal-status="
      (value) => {
        withdrawalModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4">
        <div
          v-if="selectedBeneficiary?.type === 'bank_account'"
          class="flex items-center gap-2"
        >
          <CommonImage
            :image="selectedBeneficiary.bank?.logo"
            :alt="
              selectedBeneficiary.bank?.name || selectedBeneficiary.accountName
            "
            type="image"
          />
          <div>
            <p class="text-sm md:text-xs">
              {{ selectedBeneficiary?.accountName }}
            </p>
            <p class="text-xs md:text-sm">
              {{ selectedBeneficiary?.accountNumber }}

              {{
                selectedBeneficiary.bank
                  ? `(${selectedBeneficiary.bank?.name})`
                  : `(${selectedBeneficiary.currency} account)`
              }}
            </p>
          </div>
        </div>

        <div
          v-if="selectedBeneficiary?.type === 'platform'"
          class="flex flex-col gap-4"
        >
          <div class="flex items-center gap-2">
            <CommonImage
              :image="selectedBeneficiary?.beneficiaryUser?.profileImage"
              alt="avatar"
              type="image"
            />
            <div>
              <p class="text-sm md:text-xs">
                {{ selectedBeneficiary?.beneficiaryUser?.name }}
              </p>
              <p class="text-xs md:text-sm">
                @{{ selectedBeneficiary?.beneficiaryUser?.tag }}
              </p>
            </div>
          </div>

          <CommonFormSelect
            title="Select currency"
            :selected="selectedCurrency"
            :options="allCurrencies"
            @change-option="handleCurrencyChange"
            placeholder="-- Please select a currency --"
          />
        </div>

        <CommonAmountInput
          v-model="amount"
          title="Enter amount"
          :currency="wallet?.currency"
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
          placeholder="e.g., Payment for services"
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

  <CommonModal
    :open="successModal"
    title="Withdrawal Submitted"
    @change-modal-status="
      (value) => {
        successModal = value;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-4 items-center">
        <font-awesome-icon
          icon="check-circle"
          class="text-7xl text-green-600"
        />
        <p class="text-xl font-bold">Your withdrawal has been submitted!</p>
        <p class="text-sm">
          You have successfully placed a withdrawal of
          {{ formatMoney(amount) }} {{ wallet?.currency }} to your beneficiary.
        </p>
      </div>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="successModal = false"
        custom-css="bg-base w-full text-base"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useWalletStore } from "~/store/wallet";
import type { IBeneficiary } from "~/types/wallet";

export default defineComponent({
  async setup() {
    useSeoMeta({
      title: "Send",
      ogTitle: "Send",
    });
    onBeforeMount(async () => {
      await Promise.all([fetchBanks(), fetchWallets(), fetchBeneficiaries()]);
    });

    const { $api } = useNuxtApp();
    const addAccountModal = ref(false);
    const accountNumber = ref("");
    const bankCode = ref("");

    const bankCodeNamesByCurrency: Record<string, string> = {
      EUR: "Bank code (BIC/SWIFT)",
      USD: "Routing Number",
      GBP: "Sort Code",
      AUD: "BSB Code",
      CAD: "Institution Number",
      JPY: "Bank Code",
      CNY: "CNAPS Code",
      CHF: "Clearing Number",
      SEK: "Bankgiro Number",
      NOK: "Bank Code",
      NZD: "BSB Number",
      MXN: "CLABE",
    };
    const accountNumberNamesByCurrency: Record<string, string> = {
      EUR: "IBAN",
      BTC: "Crypto Address",
      USDC: "Crypto Address",
    };
    const isInternationalCurrency = (cur: string) => {
      return ["EUR", "GBP", "AUD", "MXN", "USD"].includes(cur);
    };
    const isAfricanCurrency = (cur: string) => {
      return ["NGN", "GHS", "KES", "ZAR"].includes(cur);
    };
    const isCryptoCurrency = (cur: string) => {
      return ["BTC", "USDC"].includes(cur);
    };

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

    const allCurrencies = computed(() => wallets.value.map((i) => i.currency));

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

    const beneficiaryType = ref<"bank_account" | "platform">("bank_account");
    const beneficiaryTag = ref();
    const isCreateBeneficiaryLoading = ref(false);
    const accountName = ref("");

    const isVerifyAccountNumberLoading = ref(false);
    const verifyAccountNumber = async () => {
      try {
        isVerifyAccountNumberLoading.value = true;
        accountName.value = "";
        const resp = await $api.paymentService.verifyAccountNumber({
          accountNumber: accountNumber.value,
          bankId: selectedBankId.value,
        });
        accountName.value = resp.accountName;
      } finally {
        isVerifyAccountNumberLoading.value = false;
      }
    };
    const createBeneficiary = async () => {
      try {
        isCreateBeneficiaryLoading.value = true;
        if (
          beneficiaryType.value === "bank_account" &&
          isAfricanCurrency(selectedCurrency.value)
        ) {
          await verifyAccountNumber();
        }
        await $api.walletService.createBeneficiary({
          beneficiaryType: beneficiaryType.value,
          ...(beneficiaryType.value === "bank_account"
            ? {
                accountNumber: accountNumber.value,
                accountName: accountName.value,
                ...(selectedBankId.value && { bank: selectedBankId.value }),
                ...(bankCode.value && { bankCode: bankCode.value }),
                currency: selectedCurrency.value,
              }
            : {
                beneficiaryTag: beneficiaryTag.value,
              }),
        });
        addAccountModal.value = false;
        fetchBeneficiaries();
        notify({
          type: "success",
          title: "beneficiary created",
        });
      } finally {
        isCreateBeneficiaryLoading.value = false;
      }
    };

    const handleCurrencyChange = (newVal: string) => {
      selectedCurrency.value = newVal;
    };
    const handleBankChange = (newVal: string) => {
      selectedBankId.value = newVal;
    };

    const beneficiaries = ref<IBeneficiary[]>([]);
    const isFetchBeneficiariesLoading = ref(false);
    const fetchBeneficiaries = async () => {
      await withLoadingPromise(
        $api.walletService.fetchBeneficiaries().then((resp) => {
          beneficiaries.value = resp;
        }),
        isFetchBeneficiariesLoading
      );
    };

    const fetchBanks = async () => {
      const banks = await $api.paymentService.fetchBanks();
      setBanks(banks);
    };

    const note = ref("");
    const amount = ref(100);
    const selectedBeneficiary = ref<IBeneficiary>();
    const password = ref("");
    const isWithdrawLoading = ref(false);
    const successModal = ref(false);
    const withdraw = async () => {
      if (!selectedBeneficiary.value) {
        return;
      }
      await withLoadingPromise(
        $api.walletService
          .withdraw({
            note: note.value,
            amount: amount.value,
            beneficiary: selectedBeneficiary.value?.id,
            password: password.value,
            currency: selectedCurrency.value,
          })
          .then(() => {
            withdrawalModal.value = false;
            successModal.value = true;
          }),
        isWithdrawLoading
      );
    };

    const withdrawalModal = ref(false);
    const openWithdrawalModal = (_selectedBeneficiary: IBeneficiary) => {
      selectedBeneficiary.value = _selectedBeneficiary;
      withdrawalModal.value = true;
    };

    const wallet = computed(() => {
      const targetCurrency =
        selectedBeneficiary.value?.currency ||
        selectedBeneficiary.value?.bank?.currency ||
        selectedCurrency.value;
      return wallets.value.find((w) => w.currency === targetCurrency);
    });

    return {
      selectedCurrency,
      accountNumber,
      addAccountModal,
      createBeneficiary,
      groupedBanksByCurrency,
      withdrawableCurrencies,
      handleCurrencyChange,
      isFetchWalletLoading,
      selectedBankId,
      handleBankChange,
      isCreateBeneficiaryLoading,
      isFetchBeneficiariesLoading,
      beneficiaries,
      withdrawalModal,
      selectedBeneficiary,
      amount,
      note,
      password,
      isWithdrawLoading,
      withdraw,
      openWithdrawalModal,
      wallet,
      successModal,
      accountName,
      beneficiaryType,
      beneficiaryTag,
      allCurrencies,
      verifyAccountNumber,
      isVerifyAccountNumberLoading,
      bankCode,
      bankCodeNamesByCurrency,
      accountNumberNamesByCurrency,
      isInternationalCurrency,
      isCryptoCurrency,
      isAfricanCurrency,
    };
  },
});
</script>
