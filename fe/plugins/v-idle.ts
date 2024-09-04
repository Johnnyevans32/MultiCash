import Vidle from "v-idle-3";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vidle, {});
});
