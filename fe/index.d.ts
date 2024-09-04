import { AuthService } from "~/services/auth";
import { WalletService } from "~/services/wallet";
import { ExchangeService } from "~/services/exchange";
import { PaymentService } from "~/services/payment";
import { UserService } from "~/services/user";

interface ApiInstance {
  authService: AuthService;
  walletService: WalletService;
  exchangeService: ExchangeService;
  paymentService: PaymentService;
  userService: UserService;
}

declare module "#app" {
  interface NuxtApp {
    $api: ApiInstance;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $api: ApiInstance;
  }
}

export {};
