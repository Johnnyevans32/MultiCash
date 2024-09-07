import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export function useAppVueUtils() {
  const config = useRuntimeConfig();
  const route = useRoute();
  const { accessToken } = storeToRefs(useUserStore());
  const { setAccessToken } = useUserStore();

  const useCustomFetch = async <T>(url: string, options?: any): Promise<T> => {
    const res = await $fetch<T>(url, {
      ...options,
      async onResponseError({ response }) {
        notify({
          type: "error",
          title: response._data?.message || "an error occured",
        });
        if (response.status === 401) {
          const { path } = route;
          if (path === "/signin") {
            return;
          }
          setAccessToken(null);
          await navigateTo("/signin");
          return;
        }
      },
      async onRequest({ request, options }) {
        options.baseURL = config.public.apiUrl;
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken.value}`,
        };
      },
      async onRequestError({ request, options, error }) {},
    });

    return res as T;
  };

  return {
    useCustomFetch,
  };
}
