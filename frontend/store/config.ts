export enum AppThemeEnum {
  LIGHT = "light",
  WHITE = "white",
  DARK = "dark",
  MIDNIGHT = "midnight",
  COFFEE = "coffee",
  LAVENDER_DREAM = "lavender-dream",
  LEMON = "lemon",
}

export const useConfigStore = defineStore(
  "configStore",
  () => {
    const appThemeColor = ref<string>("light");
    const autoLogoutEnabled = ref(false);
    const autoLogoutTimeoutInMins = ref(5);
    const loadingScreenEnabled = ref<boolean>(false);

    function setAutoLogoutEnabled(value: boolean) {
      autoLogoutEnabled.value = value;
    }

    function toggleAppTheme(theme: string) {
      appThemeColor.value = theme;
    }
    function setAutoLogoutTimeoutInMins(_time: number) {
      autoLogoutTimeoutInMins.value = _time;
    }
    function updateLoadingScreenStatus(status: boolean) {
      loadingScreenEnabled.value = status;
    }

    return {
      appThemeColor,
      autoLogoutTimeoutInMins,
      loadingScreenEnabled,
      autoLogoutEnabled,
      toggleAppTheme,
      setAutoLogoutTimeoutInMins,
      setAutoLogoutEnabled,
      updateLoadingScreenStatus,
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
