import { storeToRefs } from "pinia";
import { useUserStore } from "~/store/user";

export default defineNuxtRouteMiddleware(async (to) => {
  const { accessToken } = storeToRefs(useUserStore());

  if (!to.meta.layout || to.meta.layout === "default") {
    if (!accessToken.value) {
      return navigateTo(`/signin?redirect=${to.fullPath}`);
    }
  }
  if (to.meta.layout === "auth") {
    if (accessToken.value) {
      return navigateTo("/");
    }
  }
});
