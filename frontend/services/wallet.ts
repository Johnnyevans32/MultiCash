import type { IResponse } from "~/types/user";
import type {
  IWallet,
  IWalletAccount,
  IWalletTransaction,
} from "~/types/wallet";

export class WalletService {
  async fetchWallets() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IWallet[]>>(
      `/api/wallets`,
      {
        method: "get",
      }
    );
    return data;
  }

  async fetchWalletTransactions(walletId: string, page = 1, search = "") {
    const query = new URLSearchParams({
      page: page.toString(),
      ...(search && { search }),
    }).toString();
    const { useCustomFetch } = useAppVueUtils();
    const { data, metadata } = await useCustomFetch<
      IResponse<IWalletTransaction[]>
    >(`/api/wallets/${walletId}/transactions?${query}`, {
      method: "get",
    });

    return { data, metadata };
  }

  async withdraw(payload: {
    amount: number;
    note: string;
    walletAccount: string;
    password: string;
  }) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/withdraw`, {
      method: "post",
      body: payload,
    });
  }

  async createWalletAccount(payload: {
    accountNumber: string;
    accountName: string;
    bank: string;
  }) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/accounts`, {
      method: "post",
      body: payload,
    });
  }

  async fetchWalletAccounts() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IWalletAccount[]>>(
      `/api/wallets/accounts`,
      {
        method: "get",
      }
    );
    return data;
  }

  async deleteWalletAccount(walletAccountId: string) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/accounts/${walletAccountId}`, {
      method: "delete",
    });
  }
}
