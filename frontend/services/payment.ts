import type { IResponse } from "~/types/user";
import type { IBank } from "~/types/wallet";

export class PaymentService {
  async fetchBanks(currency?: string) {
    const query = new URLSearchParams({
      ...(currency && { currency }),
    }).toString();
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IBank[]>>(
      `/api/payments/banks?${query}`,
      {
        method: "get",
      }
    );
    return data;
  }

  async verifyAccountNumber(payload: {
    accountNumber: string;
    bankId?: string;
    bankCode?: string;
    accountName?: string;
    currency: string;
    recipientType?: string;
    accountType?: string;
    address?: any;
  }) {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<{ accountName: string }>>(
      `/api/payments/verify/account`,
      {
        method: "post",
        body: payload,
      }
    );
    return data;
  }

  async createCheckoutSession(payload: { amount: number; currency: string }) {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<{ sessionId: string }>>(
      `/api/payments/session`,
      {
        method: "post",
        body: payload,
      }
    );
    return data;
  }
}
