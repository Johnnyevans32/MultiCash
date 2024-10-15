import type { IUser } from "~/types/user";
import { useWalletStore } from "./wallet";

export const useUserStore = defineStore(
  "userStore",
  () => {
    const user = ref<IUser | null>(null);
    const accessToken = ref<string | null>();
    const sessionClientId = ref("");

    function setUser(_user: any) {
      user.value = _user;
    }
    function setSessionClientId(_id: string) {
      sessionClientId.value = _id;
    }
    function setAccessToken(token: any) {
      accessToken.value = token;
      if (!token) {
        const { resetStore: resetWalletStore } = useWalletStore();
        user.value = null;
        sessionClientId.value = "";
        resetWalletStore();
      }
    }

    return {
      accessToken,
      user,
      sessionClientId,

      setAccessToken,
      setUser,
      setSessionClientId,
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
