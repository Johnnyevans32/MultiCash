import html2pdf from "html2pdf.js";
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
    const { useCustomFetch } = useAppVueUtils();

    const { data: receiptHtml } = await useCustomFetch<IResponse<string>>(
      `/api/wallets/transactions/${transactionId}/receipt`,
      {
        method: "get",
      }
    );

    // Create a new HTML element to hold the content
    const element = document.createElement("div");
    element.innerHTML = receiptHtml;

    // Use html2pdf.js to generate the PDF
    const options = {
      margin: 1,
      filename: `transaction_receipt_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    // Create the PDF
    try {
      await html2pdf().from(element).set(options).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
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
