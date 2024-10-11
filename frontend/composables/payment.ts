import { notify } from "@kyvg/vue3-notification";
import Paystack from "@paystack/inline-js";
import { loadStripe } from "@stripe/stripe-js";
import { useUserStore } from "~/store/user";

export function useFundWallet() {
  const isLoading = ref(false);
  const { $api } = useNuxtApp();
  const config = useRuntimeConfig();
  const { user } = storeToRefs(useUserStore());

  const providerMap = {
    paystack: async (amount: number, currency: string) => {
      const popup = new Paystack();
      return new Promise((resolve, reject) => {
        popup.checkout({
          key: config.public.paystackPublickKey,
          email: user.value?.email,
          amount: amount * 100,
          metadata: { user: user.value?.id },
          currency,
          onSuccess: resolve,
          onLoad: () => {},
          onCancel: () => reject(new Error("Transaction cancelled by user.")),
          onError: (error: { message: string | undefined }) =>
            reject(new Error(error.message || "Transaction failed.")),
        });
      });
    },
    stripe: async (amount: number, currency: string) => {
      const { sessionId } = await $api.paymentService.createCheckoutSession({
        amount,
        currency,
      });
      const stripe = await loadStripe(config.public.stripePublicKey);
      if (stripe) {
        await stripe.redirectToCheckout({
          sessionId,
        });
      }
    },
  };

  const getProvider = (currency: string) => {
    switch (currency) {
      case "NGN":
      case "GHS":
      case "KES":
      case "ZAR":
        return providerMap.paystack;
      case "USD":
      case "EUR":
      case "GBP":
      case "AUD":
      case "MXN":
        return providerMap.stripe;
      default:
        throw new Error("Unsupported currency");
    }
  };

  const fundWallet = async (amount: number, currency: string) => {
    const provider = getProvider(currency);

    try {
      isLoading.value = true;
      await provider(amount, currency);
    } catch (error: any) {
      notify({
        type: "error",
        title: error.message || "Transaction failed.",
      });
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    fundWallet,
  };
}
