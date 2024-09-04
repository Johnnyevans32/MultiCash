import { AuthService } from "~/services/auth";
import { WalletService } from "~/services/wallet";
import { ExchangeService } from "~/services/exchange";
import { PaymentService } from "~/services/payment";
import { UserService } from "~/services/user";

export default defineNuxtPlugin(() => {
  const modules = {
    authService: new AuthService(),
    walletService: new WalletService(),
    exchangeService: new ExchangeService(),
    paymentService: new PaymentService(),
    userService: new UserService(),
  };

  return {
    provide: {
      api: modules,
    },
  };
});
