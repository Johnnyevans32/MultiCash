import type { IUser } from "~/types/user";

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
        user.value = null;
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
