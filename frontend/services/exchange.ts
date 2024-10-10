import type { IExchange, IMatchedOffering, IPfi } from "~/types/exchange";
import type { IResponse } from "~/types/user";

export class ExchangeService {
  async fetchPfis() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IPfi[]>>(
      `/api/exchanges/pfis`,
      {
        method: "get",
      }
    );
    return data;
  }

  async getOfferings(payinCurrency: string, payoutCurrency: string) {
    const query = new URLSearchParams({
      payinCurrency,
      payoutCurrency,
    }).toString();
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IMatchedOffering[]>>(
      `/api/exchanges/offerings?${query}`,
      {
        method: "get",
      }
    );
    return data;
  }

  async createExchange(payload: { offerings: string[]; payinAmount: number }) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges`, {
      method: "post",
      body: payload,
    });
  }

  async fetchExchangeSummary(payload: {
    offerings: string[];
    payinAmount: number;
  }) {
    const { offerings, payinAmount } = payload;
    const params = new URLSearchParams({ payinAmount: payinAmount.toString() });
    offerings.forEach((offering) => params.append("offerings", offering));
    const query = params.toString();
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IExchange>>(
      `/api/exchanges/summary?${query}`,
      {
        method: "get",
      }
    );
    return data;
  }

  async fetchExchanges(page = 1) {
    const query = new URLSearchParams({
      page: page.toString(),
    }).toString();
    const { useCustomFetch } = useAppVueUtils();
    const { data, metadata } = await useCustomFetch<IResponse<IExchange[]>>(
      `/api/exchanges?${query}`,
      {
        method: "get",
      }
    );
    return { data, metadata };
  }

  async rateExchange(exchangeId: string, rating?: number, comment?: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/${exchangeId}/rate`, {
      method: "put",
      body: { rating, comment },
    });
  }

  async closeOffering(offeringId: string, reason?: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/offerings/${offeringId}/close`, {
      method: "put",
      body: { reason },
    });
  }
}
