import type { IUser } from "~/types/user";
import { useWalletStore } from "./wallet";

export const useUserStore = defineStore(
  "userStore",
  () => {
    const user = ref<IUser | null>(null);
    const accessToken = ref<string | null>();

    function setUser(_user: any) {
      user.value = _user;
    }
    function setAccessToken(token: any) {
      accessToken.value = token;
      if (!token) {
        const { resetStore: resetWalletStore } = useWalletStore();
        user.value = null;
        resetWalletStore();
      }
    }

    return {
      accessToken,
      user,

      setAccessToken,
      setUser,
    };
  },
  {
    persist: {
      storage: persistedState.localStorage,
      afterRestore: (ctx) => {
        console.log(`just restored '${ctx.store.$id}'`);
      },
    },
  }
);
