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

interface PwaInjection {
  /**
   * @deprecated use `isPWAInstalled` instead
   */
  isInstalled: boolean;
  /**
   * From version v0.3.5+.
   */
  isPWAInstalled: Ref<boolean>;
  showInstallPrompt: Ref<boolean>;
  cancelInstall: () => void;
  install: () => Promise<void>;
  swActivated: Ref<boolean>;
  registrationError: Ref<boolean>;
  offlineReady: Ref<boolean>;
  needRefresh: Ref<boolean>;
  updateServiceWorker: (reloadPage?: boolean | undefined) => Promise<void>;
  cancelPrompt: () => Promise<void>;
  getSWRegistration: () => ServiceWorkerRegistration | undefined;
}

declare module "#app" {
  interface NuxtApp {
    $api: ApiInstance;
    $pwa: PwaInjection;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $api: ApiInstance;
    $pwa: PwaInjection;
  }
}

export {};
