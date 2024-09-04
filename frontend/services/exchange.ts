export class ExchangeService {
  async fetchPfis() {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/pfis`, {
      method: "get",
    });
  }

  async getOfferings(payinCurrency: string, payoutCurrency: string) {
    const query = new URLSearchParams({
      payinCurrency,
      payoutCurrency,
    }).toString();
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/offerings?${query}`, {
      method: "get",
    });
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
    return useCustomFetch(`/api/exchanges?${query}`, {
      method: "get",
    });
  }

  async ratingExchange(exchangeId: string, rating: number) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/exchanges/:${exchangeId}/rate`, {
      method: "put",
      body: { rating },
    });
  }
}
