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
        class="cursor-pointer py-5 md:px-5 px-2 flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base"
        @click="openTransactionDetailModal(txn)"
      >
        <div class="flex md:gap-4 gap-1 items-center w-[70%]">
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
      () => route.query.currency,
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
      pending: "text-blue-700 bg-blue-100",
      processing: "text-yellow-700 bg-yellow-100",
      successful: "text-green-700 bg-green-100",
      failed: "text-red-700 bg-red-100",
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
      } = modalTransaction.value;

      return [
        {
          title: `You were ${type === "debit" ? "debited" : "credited"}`,
          value: `${currency} ${formatMoney(amount)}`,
        },
        {
          title: "Status",
          value: status,
          extraClass: `font-bold md:text-xs text-tiny py-1 px-2 rounded-lg ${
            (txnStatusStyles.value as any)[status]
          }`,
        },
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
          title: "Transaction Type",
          value: type === "debit" ? "Debit" : "Credit",
        },
        ...(note
          ? [
              {
                title: "Transaction Note",
                value: note,
              },
            ]
          : []),
      ];
    });

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
    };
  },
});
</script>

<style scoped>
.balance-card {
  background-image: url("data:image/svg+xml,<svg id='patternId' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='a' patternUnits='userSpaceOnUse' width='100' height='100' patternTransform='scale(1) rotate(0)'><rect x='0' y='0' width='100%' height='100%' fill='hsla(240, 6.7%, 17.600000000000005%, 1)'/><path d='M100 20.234v41.641q-6.719 7.656-10.234 17.812-3.36 9.766-3.125 20.313h-3.438v-4.531q0-2.657.39-4.532l.626-3.359.703-3.281 2.265-7.656q1.329-4.22 2.813-7.344.781-1.719 2.812-4.453l2.891-4.297.86-2.578.312-2.735q.156-5-.547-13.203l-2.344-20.937Q92.656 8.516 92.422 0h6.797q-.078 6.172.078 10.156.156 5.547.703 10.078m0 49.532v20.468q-.469 2.11-.703 4.844L99.063 100H92.5l-.078-8.594q0-5.156.547-8.515.469-3.047 2.89-6.797L100 69.766M79.219 100h-3.672l.39-8.36.938-8.359q1.016-6.953 1.875-10.781 1.328-5.86 3.36-10.313l2.5-6.015 1.562-6.328.547-5q.078-2.813-.703-4.844l-3.282-9.531-3.28-9.531q-1.876-6.094-2.735-10.313Q75.547 4.922 75.547 0h3.672q.078 8.516 2.422 17.031 2.343 8.282 6.718 15.782l-2.03-11.016-1.876-11.016-.86-5.312L83.126 0h3.516l.234 4.531.547 4.532 2.5 16.25 2.422 16.328q1.015 8.125.156 15.625l-.625 3.28q-.547 1.798-1.562 2.97l-1.875 1.953q-1.094 1.172-1.641 2.187-1.64 2.735-2.89 7.813l-2.423 8.047q-1.406 3.515-1.875 8.125-.39 3.125-.39 8.359m-6.406 0H64.53q-2.11-9.922-1.718-18.828.39-4.922 1.796-8.203l2.97-7.5q1.405-4.219 1.718-7.89.312-2.735-.39-5.313-.704-2.657-2.345-4.844-2.343-3.125-5.78-6.328l-.938 2.5-.86 2.656q-2.343 6.797-4.922 11.953-3.125 6.25-7.03 10.86-1.485 2.265-2.579 5.312-.781 2.344-1.484 5.781Q41.25 88.75 41.25 100h-6.484l.312-12.266q.39-6.718 1.64-12.265 1.72-7.344 4.844-11.407l2.344-2.5 2.344-2.5q2.5-2.968 3.906-6.875 1.328-3.671 1.485-7.734.156-5.156-.86-12.5L48.906 19.61Q47.578 8.516 47.97 0h10.078q-.625 12.188 1.875 22.11 2.422 9.218 8.515 16.25l5 5.234q3.047 3.203 4.375 5.781 2.657 4.922.938 12.266-1.016 4.609-3.906 10.859-1.172 2.578-1.797 5.86-.547 2.5-.781 6.093-.391 7.266.546 15.547m-14.765 0H47.969V89.453q.312-5.937 1.718-10.39 4.297-12.657 10.157-22.813l1.797-3.047 2.109-2.812q1.25 4.687-1.094 11.562-5.625 16.953-4.61 38.047m-29.296 0H17.969l.234-5.781.469-5.782L21.25 65.86l2.422-22.578q1.172-12.031-1.875-21.797-1.719 3.047-2.969 7.5l-2.031 7.813q-.469 1.719-.547 4.219l.078 4.218-.547 11.094-1.797 10.469Q12.5 74.062 12.11 77.266q-.39 2.734-.312 6.406l.234 6.406.39 5q.235 2.813.704 4.922H5.781V81.25l-.078-6.016Q1.563 81.797 0 89.844v-20.39q5.86-10.47 7.422-22.657 1.25-9.14.078-23.36L6.406 11.72Q5.86 4.844 5.781 0h7.344l1.406 11.328 1.094 11.328q1.25-2.422 1.797-6.015l.625-6.25.078-5.157L17.969 0h10.86q.077 2.969.702 6.953l1.172 6.797 1.64 11.094q.626 6.172.157 11.172-.547 4.297-2.031 9.687L27.5 55.078q-2.031 6.719-2.344 14.531-.078 3.75.625 8.36l1.563 8.203.703-2.422 4.531-18.672q2.344-10.312 3.594-18.828.625-3.984.625-9.062l-.313-9.141-1.093-13.984Q34.688 5.547 34.766 0h6.484q-.078 8.984 1.953 19.688l1.64 8.75q.938 5.078.938 8.75 0 3.828-1.015 7.5-.938 3.671-2.813 6.874-4.61 9.375-7.812 20.47-2.813 9.687-4.766 21.405-.703 3.75-.625 6.563M0 61.797V19.766l.781 4.375.703 4.453 2.344 13.984.235 1.563.234 2.343Q5.078 54.61 0 61.797M64.61 0h8.202q-.39 7.266.157 11.953l.86 4.531 1.25 4.532 3.593 13.672 3.36 13.671.546 2.657.156 2.656-2.343-6.406q-1.407-3.516-3.047-6.172l-4.14-6.64-4.298-6.563q-1.172-1.953-1.875-4.61-.547-1.875-.937-4.922Q64.844 9.453 64.609 0'  stroke-width='1' stroke='none' fill='hsla(47, 0%, 0%, 1)'/></pattern></defs><rect width='800%' height='800%' transform='translate(0,0)' fill='url(%23a)'/></svg>");
}
</style>
