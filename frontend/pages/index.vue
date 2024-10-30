<template>
  <div class="flex items-center justify-between">
    <CommonButton
      text="Add Funds"
      imageType="icon"
      image="fa-solid fa-plus"
      @btn-action="handleFundWalletBtnClick"
    />

    <div class="flex gap-2 items-center">
      <CommonListbox
        v-if="!isLoadingWallets"
        :selected="selectedCurrency"
        :options="walletCurrencies"
        @change-option="handleCurrencyChange"
        customCss="!text-center"
      />
      <CommonButton text="Wallets" @btn-action="walletsModal = true" />
    </div>
  </div>
  <!-- <div
    class="balance-card text-white flex items-center justify-between p-5 font-bold rounded-xl md:text-3xl text-xl"
  > -->
  <div
    class="flex items-center justify-between p-5 font-bold rounded-xl border bg-lightbase border-base md:text-3xl text-xl"
  >
    <p class="text-left">Balance</p>
    <p v-show="!isLoadingWallets" class="text-right">
      {{ selectedWallet?.currency }}
      {{ formatMoney(selectedWallet?.availableBalance, 8) }}
    </p>
    <div
      v-show="isLoadingWallets"
      class="h-10 w-28 bg-base rounded animate-pulse"
    ></div>
  </div>
  <div
    v-show="!isLoadingWalletTransactions"
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
        @search="searchTransactions"
      />
    </div>
  </div>

  <div v-show="isLoadingWalletTransactions">
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

  <div v-show="!isLoadingWalletTransactions && !walletTransactions.length">
    <font-awesome-icon
      class="text-7xl mb-5"
      _icon="magnifying-glass-dollar"
      icon="frown"
    />
    <p>No transactions yet</p>
    <p>Your transactions will appear here once they arrive.</p>
  </div>

  <div v-show="!isLoadingWalletTransactions && walletTransactions.length">
    <div
      v-for="(transactions, date) in formatedWalletTransactions"
      :key="date"
      class="text-left"
    >
      <span>{{ date }}</span>
      <div
        v-for="txn in transactions"
        :key="txn.id"
        class="cursor-pointer p-5 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base"
        @click="openTransactionDetailModal(txn)"
      >
        <div class="flex space-x-2 items-center w-[70%]">
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
              v-show="txn?.type === 'debit'"
              icon="fa-solid fa-circle-right"
              :style="{ transform: 'rotate(315deg)' }"
              class="text-red-600 rounded-xl bg-white absolute -bottom-[1px] -right-[1px] border-[1px] border-white"
            />
            <font-awesome-icon
              v-show="txn?.type === 'credit'"
              icon="fa-solid fa-circle-right"
              :style="{ transform: 'rotate(135deg)' }"
              class="text-green-600 rounded-xl bg-white absolute -bottom-[1px] -right-[1px] border-[1px] border-white"
            />
          </div>

          <div class="flex flex-col text-left">
            <span class="line-clamp-1 md:text-tbase text-sm">{{
              txn.description
            }}</span>
            <span class="md:text-sm text-tiny">{{
              txn?.purpose?.replaceAll("_", " ")
            }}</span>
          </div>
        </div>
        <div class="flex flex-col text-right">
          <span
            class="md:text-tbase text-xs"
            :class="txn?.type === 'credit' ? 'text-green-600' : 'text-red-600'"
            >{{ getCurrencySign(txn.currency || txn.walletStateAfter.currency)
            }}{{ formatMoney(txn.amount, 8) }}
          </span>
          <span class="md:text-sm text-tiny"
            >{{ getCurrencySign(txn.currency || txn.walletStateAfter.currency)
            }}{{ formatMoney(txn.walletStateAfter.availableBalance, 8) }}</span
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
            title="Enter amount to fund"
            :currency="selectedCurrency"
            @keyup.enter="handleFundWallet"
          />
        </div>
      </template>
      <template v-slot:footer>
        <CommonButton
          text="Cancel"
          @btn-action="fundWalletModal = false"
          custom-css="bg-red-600 w-full text-white"
        />
        <CommonButton
          text="Fund"
          @btn-action="handleFundWallet"
          custom-css="!bg-blue-600 w-full text-white"
          :loading="isLoadingFundingWallet"
        />
      </template>
    </CommonModal>
  </div>

  <CommonModal
    v-if="modalTransaction"
    :open="transactionDetailsModal"
    title="Transaction Details"
    @change-modal-status="
      (newVal) => {
        transactionDetailsModal = newVal;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-2">
        <div
          v-for="(detail, index) in transactionDetails"
          :key="index"
          class="flex flex-col items-start"
        >
          <span>{{ detail.title }}:</span>
          <span :class="detail?.extraClass || 'font-bold'">
            {{ detail.value }}
          </span>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="transactionDetailsModal = false"
        custom-css="bg-base w-full text-base"
      />
      <CommonButton
        text="Download Receipt"
        @btn-action="downloadTransactionReceipt"
        custom-css="!bg-blue-600 w-full text-white"
        :loading="isLoadingDownloadTransactionReceipt"
      />
    </template>
  </CommonModal>

  <CommonModal
    v-if="wallets.length"
    :open="walletsModal"
    title="Wallets"
    @change-modal-status="
      (newVal) => {
        walletsModal = newVal;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-2">
        <div
          v-for="wallet in wallets"
          :key="wallet.id"
          class="flex items-center h-12 gap-4"
        >
          <CommonImage
            :image="wallet.walletCurrency.logo"
            :alt="wallet.currency"
          />

          <div class="flex flex-col text-left">
            <span class="font-bold"
              >{{ wallet.currency }}
              {{ formatMoney(wallet.availableBalance, 10) }}</span
            >
            <span>{{ wallet.walletCurrency.name }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="walletsModal = false"
        custom-css="bg-base w-full text-base"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useWalletStore } from "~/store/wallet";
import type { IWallet, IWalletTransaction } from "~/types/wallet";
import { type IMetadata } from "~/types/user";

export default defineComponent({
  async setup() {
    useSeoMeta({
      title: "Wallet",
      ogTitle: "Wallet",
    });
    const { wallets } = storeToRefs(useWalletStore());
    const { $api } = useNuxtApp();
    const { withLoadingPromise } = useLoading();

    onBeforeMount(async () => {
      fetchWallets();
    });

    const walletCurrencies = computed(() =>
      wallets.value.map((i: { currency: string }) => i.currency)
    );
    const route = useRoute();
    const router = useRouter();
    const selectedCurrency = ref("");
    const handleCurrencyFromQuery = () => {
      const queryCurrency = (route.query.currency as string)?.toUpperCase();

      selectedCurrency.value = walletCurrencies.value.includes(queryCurrency)
        ? queryCurrency
        : selectedCurrency.value || walletCurrencies.value[0];
    };

    watch(
      () => route.query.currency as string,
      (newCurrency: string) => {
        if (walletCurrencies.value.includes(newCurrency?.toUpperCase())) {
          selectedCurrency.value = newCurrency?.toUpperCase();
        }
      }
    );

    watch(
      () => route.query.r,
      () => {
        fetchWallets();
      }
    );

    watch(selectedCurrency, (newCurrency: string) => {
      if (newCurrency) {
        router.push({
          query: { ...route.query, currency: newCurrency.toLowerCase() },
        });
      }
    });

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
      const { setWallets } = useWalletStore();
      await withLoadingPromise(
        $api.walletService.fetchWallets().then((walletsResponse: IWallet[]) => {
          setWallets(walletsResponse);
          handleCurrencyFromQuery();
        }),
        isLoadingWallets
      );

      await fetchWalletTransactions();
    };
    const fetchWalletTransactions = async (payload?: {
      page?: number;
      search?: string;
    }) => {
      if (selectedWallet.value) {
        await withLoadingPromise(
          $api.walletService
            .fetchWalletTransactions({
              ...payload,
              walletId: selectedWallet.value.id,
            })
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
      fetchWalletTransactions({ page: currentPage.value });
    };

    const fundWalletModal = ref(false);
    const amount = ref(0);
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
    const { isLoading: isLoadingFundingWallet, fundWallet } = useFundWallet();
    const handleFundWallet = async () => {
      await fundWallet(amount.value, selectedCurrency.value);
      fundWalletModal.value = false;
    };

    const searchQuery = ref("");
    const searchTransactions = () => {
      fetchWalletTransactions({ search: searchQuery.value });
    };

    const transactionDetailsModal = ref(false);
    const modalTransaction = ref<IWalletTransaction>();
    const openTransactionDetailModal = (transaction: any) => {
      modalTransaction.value = transaction;
      transactionDetailsModal.value = true;
    };

    const walletsModal = ref(false);
    const txnStatusStyles = ref({
      pending: "text-blue-700 bg-blue-100 border-blue-700",
      processing: "text-yellow-700 bg-yellow-100 border-yellow-700",
      successful: "text-green-700 bg-green-100 border-green-700",
      failed: "text-red-700 bg-red-100 border-red-700",
    });

    const transactionDetails = computed(() => {
      if (!modalTransaction.value) {
        return [];
      }
      const {
        type,
        currency,
        amount,
        status,
        description,
        purpose,
        walletStateBefore,
        walletStateAfter,
        createdAt,
        note,
        transferReference,
      } = modalTransaction.value;

      return [
        {
          title: `You were ${type === "debit" ? "debited" : "credited"}`,
          value: `${currency} ${formatMoney(amount)}`,
        },
        {
          title: "Status",
          value: status,
          extraClass: `font-bold md:text-xs text-tiny py-[2px] px-2 rounded-lg border ${
            (txnStatusStyles.value as any)[status]
          }`,
        },
        ...(transferReference
          ? [{ title: "Transfer Reference", value: transferReference }]
          : []),
        {
          title: "Description",
          value: description,
        },
        {
          title: "Purpose",
          value: purpose.replaceAll("_", " "),
        },
        {
          title: "Balance before transaction",
          value: `${currency} ${formatMoney(
            walletStateBefore.availableBalance
          )}`,
        },
        {
          title: "Balance after transaction",
          value: `${currency} ${formatMoney(
            walletStateAfter.availableBalance
          )}`,
        },
        {
          title: "Date",
          value: formatDate(createdAt, "ddd, MMM Do YYYY, h:mm:ss a"),
        },
        {
          title: "Type",
          value: type === "debit" ? "Debit" : "Credit",
        },
        ...(note
          ? [
              {
                title: "Note",
                value: note,
              },
            ]
          : []),
      ];
    });

    const isLoadingDownloadTransactionReceipt = ref(false);
    const downloadTransactionReceipt = async () => {
      if (modalTransaction.value) {
        await withLoadingPromise(
          $api.walletService
            .downloadTransactionReceipt(modalTransaction.value.id)
            .then(() => {}),
          isLoadingDownloadTransactionReceipt
        );
      }
    };

    return {
      walletCurrencies,
      selectedCurrency,
      selectedWallet,
      isLoadingWalletTransactions,
      isLoadingWallets,
      handleFundWallet,
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
      transactionDetailsModal,
      openTransactionDetailModal,
      modalTransaction,
      walletsModal,
      wallets,
      transactionDetails,
      isLoadingDownloadTransactionReceipt,
      downloadTransactionReceipt,
    };
  },
});
</script>
