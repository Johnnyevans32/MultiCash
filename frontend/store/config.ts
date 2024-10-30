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
    const autoLogoutEnabled = ref(true);
    const autoLogoutTimeoutInMins = ref(5);
    const loadingScreenEnabled = ref<boolean>(false);

    const hasShownFeaturesModal = ref(false);

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

    function setHasShownFeaturesModal(status: boolean) {
      hasShownFeaturesModal.value = status;
    }

    function resetStore() {
      appThemeColor.value = AppThemeEnum.LIGHT;
      autoLogoutEnabled.value = false;
      autoLogoutTimeoutInMins.value = 5;
      loadingScreenEnabled.value = false;
      hasShownFeaturesModal.value = false;
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
      setHasShownFeaturesModal,
      hasShownFeaturesModal,
      resetStore,
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
