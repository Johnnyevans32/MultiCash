<template>
  <div class="flex items-center justify-between">
    <CommonButton
      text="Add Funds"
      imageType="icon"
      image="fa-solid fa-plus"
      @btn-action="handleFundWalletBtnClick"
      customCss="justify-self-end"
    />
    <CommonFormSelect
      v-if="!isLoadingWallets"
      :selected="selectedCurrency"
      :options="walletCurrencies"
      @change-option="handleCurrencyChange"
    />
  </div>
  <div
    class="flex justify-between p-5 font-bold rounded-xl border-[1px] bg-lightbase border-base md:text-3xl text-xl"
  >
    <p class="text-left">Main Balance</p>
    <p v-if="!isLoadingWallets" class="text-right">
      {{ selectedWallet?.currency }}
      {{ formatMoney(selectedWallet?.availableBalance) }}
    </p>
    <div v-else class="h-10 w-28 bg-base rounded animate-pulse"></div>
  </div>
  <div
    v-if="!isLoadingWalletTransactions"
    class="flex items-center justify-between"
  >
    <h1 class="md:block hidden text-xl font-bold">Transactions</h1>
    <div class="flex gap-2 items-center md:w-fit w-full">
      <CommonFormInput
        v-model="searchQuery"
        inputType="search"
        placeholder="search transactions"
        @keyup.enter="searchTransactions"
        customCss="pr-3 pl-9"
        class="w-full"
      />
    </div>
  </div>

  <div v-if="isLoadingWalletTransactions">
    <div v-for="i in 2" :key="i">
      <div class="h-2 w-20 bg-base rounded mb-2"></div>
      <div
        v-for="i in 2"
        :key="i"
        class="cursor-progress p-5 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
      >
        <div class="flex space-x-2 items-center">
          <div class="bg-base h-10 w-10 rounded-xl"></div>

          <div class="flex flex-col gap-2">
            <div class="h-2 w-20 bg-base rounded"></div>
            <div class="h-2 w-28 bg-base rounded"></div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="h-2 w-28 bg-base rounded"></div>
          <div class="h-2 w-20 bg-base rounded self-end"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="!isLoadingWalletTransactions && !walletTransactions.length">
    <font-awesome-icon class="text-7xl mb-5" icon="magnifying-glass-dollar" />
    <p>No transactions yet</p>
    <p>Your transactions will appear here once they arrive.</p>
  </div>

  <div v-if="!isLoadingWalletTransactions && walletTransactions.length">
    <div
      v-for="(transactions, date) in formatedWalletTransactions"
      :key="date"
      class="text-left"
    >
      <span>{{ date }}</span>
      <div
        v-for="txn in transactions"
        :key="txn.id"
        class="cursor-pointer py-5 md:px-5 px-2 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base"
      >
        <div class="flex md:space-x-2 space-x-1 items-center">
          <div class="text-sm transform translate-y-0">
            <CommonImage
              type="icon"
              :image="
                txn?.type === 'credit'
                  ? 'fas fa-money-bill-wave-alt'
                  : 'fas fa-money-bill-wave'
              "
            />

            <font-awesome-icon
              v-if="txn?.type === 'debit'"
              icon="fa-solid fa-circle-right"
              :style="{ transform: 'rotate(315deg)' }"
              class="text-red-600 rounded-xl bg-white absolute -bottom-[1px] -right-[1px] border-[1px] border-white"
            />
            <font-awesome-icon
              v-else
              icon="fa-solid fa-circle-right"
              :style="{ transform: 'rotate(135deg)' }"
              class="text-green-600 rounded-xl bg-white absolute -bottom-[1px] -right-[1px] border-[1px] border-white"
            />
          </div>

          <div class="flex flex-col text-left">
            <span class="truncate">{{ txn.description }}</span>
            <span class="text-xs">{{
              txn?.purpose?.replaceAll("_", " ")
            }}</span>
          </div>
        </div>
        <div class="flex flex-col text-right">
          <span
            class="md:text-tbase text-sm"
            :class="txn?.type === 'credit' ? 'text-green-600' : 'text-red-600'"
            >{{ txn.currency || txn.walletStateAfter.currency }}
            {{ formatMoney(txn.amount) }}
          </span>
          <span class="md:text-sm text-tiny"
            >{{ txn.currency || txn.walletStateAfter.currency }}
            {{ formatMoney(txn.walletStateAfter.availableBalance) }}</span
          >
        </div>
      </div>
    </div>
    <CommonPaginationBar
      v-if="walletTransactions.length"
      :currentPage="walletTransactionsMetadata?.page"
      :totalItems="walletTransactionsMetadata?.totalDocs"
      @change-option="handlePageChange"
    />
    <CommonModal
      :open="fundWalletModal"
      title="Fund wallet"
      @change-modal-status="
        (value) => {
          fundWalletModal = value;
        }
      "
    >
      <template v-slot:content>
        <div class="flex flex-col gap-4">
          <CommonAmountInput
            v-model="amount"
            placeholder="Enter amount"
            title="Enter amount"
            :currency="selectedCurrency"
          />
        </div>
      </template>
      <template v-slot:footer>
        <CommonButton
          text="Cancel"
          @btn-action="fundWalletModal = false"
          custom-css="bg-red-400 w-full text-black"
        />
        <CommonButton
          text="Fund"
          @btn-action="fundWallet"
          custom-css="!bg-blue-400 w-full text-black"
          :loading="isLoadingFundingWallet"
        />
      </template>
    </CommonModal>
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import Paystack from "@paystack/inline-js";
import { useWalletStore } from "~/store/wallet";
import type { IWallet, IWalletTransaction } from "~/types/wallet";
import { type IMetadata } from "~/types/user";
import { useUserStore } from "~/store/user";

export default defineComponent({
  async setup() {
    const config = useRuntimeConfig();
    const { user } = storeToRefs(useUserStore());
    const { setWallets } = useWalletStore();
    const { wallets } = storeToRefs(useWalletStore());
    const { $api } = useNuxtApp();
    const { withLoadingPromise } = useLoading();

    onBeforeMount(async () => {
      await fetchWallets();
    });

    const walletCurrencies = computed(() =>
      wallets.value.map((i: { currency: string }) => i.currency)
    );
    const selectedCurrency = ref("");

    const selectedWallet = computed(() =>
      wallets.value.find(
        (i: { currency: string }) => i.currency === selectedCurrency.value
      )
    );

    const isLoadingWallets = ref(false);
    const isLoadingWalletTransactions = ref(false);

    const walletTransactions = ref<IWalletTransaction[]>([]);
    const walletTransactionsMetadata = ref<IMetadata>();

    const formatedWalletTransactions = computed<
      Record<string, IWalletTransaction[]>
    >(() => groupByDate(walletTransactions.value, "createdAt"));

    const fetchWallets = async () => {
      await withLoadingPromise(
        $api.walletService.fetchWallets().then((walletsResponse: IWallet[]) => {
          selectedCurrency.value = walletsResponse[0]?.currency;
          setWallets(walletsResponse);
        }),
        isLoadingWallets
      );

      await fetchWalletTransactions();
    };
    const fetchWalletTransactions = async () => {
      if (selectedWallet.value) {
        await withLoadingPromise(
          $api.walletService
            .fetchWalletTransactions(
              selectedWallet.value.id,
              currentPage.value,
              searchQuery.value
            )
            .then(({ data, metadata }) => {
              walletTransactionsMetadata.value = metadata;
              walletTransactions.value = data;
            }),
          isLoadingWalletTransactions
        );
      }
    };

    const handleCurrencyChange = (newVal: string) => {
      selectedCurrency.value = newVal;
      fetchWalletTransactions();
    };

    const currentPage = ref(1);
    const handlePageChange = (newVal: number) => {
      currentPage.value = newVal;
      fetchWalletTransactions();
    };

    const fundWalletModal = ref(false);
    const amount = ref(0);
    const isLoadingFundingWallet = ref(false);

    const handleFundWalletBtnClick = () => {
      if (
        selectedWallet.value &&
        selectedWallet.value.walletCurrency.fundingEnabled
      ) {
        fundWalletModal.value = true;
      } else {
        notify({
          type: "info",
          title: `Funding not enabled for ${selectedCurrency.value} yet`,
        });
      }
    };
    const fundWallet = async () => {
      await withLoadingPromise(
        new Promise<void>(async (resolve, reject) => {
          try {
            const popup = new Paystack();
            await popup.checkout({
              key: config.public.paystackPK,
              email: user.value?.email,
              amount: amount.value * 100,
              metadata: { user: user.value?.id },
              currency: selectedCurrency.value,
              onSuccess: (transaction: any) => {
                console.log(transaction);
                fundWalletModal.value = false;
                fetchWallets();
                fetchWalletTransactions();
                resolve();
              },
              onLoad: (response: any) => {
                console.log("onLoad: ", response);
              },
              onCancel: () => {
                console.log("onCancel");
                reject(new Error("Transaction cancelled"));
              },
              onError: (error: { message: any }) => {
                console.log("Error: ", error.message);
                reject(error);
              },
            });
          } catch (error) {
            reject(error);
          }
        }),
        isLoadingFundingWallet
      );
    };

    const searchQuery = ref("");
    const searchTransactions = () => {
      fetchWalletTransactions();
    };

    return {
      walletCurrencies,
      selectedCurrency,
      selectedWallet,
      isLoadingWalletTransactions,
      isLoadingWallets,
      fundWallet,
      formatedWalletTransactions,
      walletTransactionsMetadata,
      walletTransactions,
      handlePageChange,
      handleCurrencyChange,
      amount,
      fundWalletModal,
      isLoadingFundingWallet,
      handleFundWalletBtnClick,
      searchQuery,
      searchTransactions,
    };
  },
});
</script>
