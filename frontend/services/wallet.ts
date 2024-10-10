import type { IResponse } from "~/types/user";
import type { IBeneficiary, IWallet, IWalletTransaction } from "~/types/wallet";

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

  async fetchWalletTransactions(payload: {
    walletId: string;
    page?: number;
    search?: string;
  }) {
    const { walletId, page = 1, search } = payload;
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
    beneficiary: string;
    password: string;
    currency: string;
  }) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/withdraw`, {
      method: "post",
      body: payload,
    });
  }

  async createBeneficiary(payload: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    beneficiaryTag?: string;
    beneficiaryType: string;
  }) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/beneficiaries`, {
      method: "post",
      body: payload,
    });
  }

  async fetchBeneficiaries() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IBeneficiary[]>>(
      `/api/wallets/beneficiaries`,
      {
        method: "get",
      }
    );
    return data;
  }

  async deleteBeneficiary(beneficiaryId: string) {
    const { useCustomFetch } = useAppVueUtils();
    return await useCustomFetch(`/api/wallets/beneficiaries/${beneficiaryId}`, {
      method: "delete",
    });
  }
}
