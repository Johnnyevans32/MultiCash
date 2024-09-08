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

  async rateExchange(exchangeId: string, rating: number, comments: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/${exchangeId}/rate`, {
      method: "put",
      body: { rating, comments },
    });
  }
}
