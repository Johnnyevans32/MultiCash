import { storeToRefs } from "pinia";
import { useUserStore } from "~/store/user";

export default defineNuxtRouteMiddleware(async (to) => {
  const { accessToken } = storeToRefs(useUserStore());
  const layout = to.meta?.layout;
  const fullPath = to.fullPath;

  if (!accessToken.value && (!layout || layout === "default")) {
    return navigateTo(`/signin?redirect=${encodeURIComponent(fullPath)}`);
  }

  if (accessToken.value && layout === "auth") {
    return navigateTo("/");
  }
});
