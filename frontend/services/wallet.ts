import { useUserStore } from "~/store/user";
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

  async downloadTransactionReceipt(transactionId: string) {
    const config = useRuntimeConfig();
    const { accessToken } = storeToRefs(useUserStore());

    const response = await fetch(
      `${config.public.apiUrl}/api/wallets/transactions/${transactionId}/receipt`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download the file.");
    }

    const blob = await (response as any).blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction_receipt_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  async fetchBeneficiaries(search?: string) {
    const { useCustomFetch } = useAppVueUtils();
    const query = new URLSearchParams({
      ...(search && { search }),
    }).toString();
    const { data } = await useCustomFetch<IResponse<IBeneficiary[]>>(
      `/api/wallets/beneficiaries?${query}`,
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
