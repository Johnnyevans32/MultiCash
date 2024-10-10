import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export function useAppVueUtils() {
  const config = useRuntimeConfig();
  const route = useRoute();
  const { accessToken } = storeToRefs(useUserStore());
  const { setAccessToken } = useUserStore();

  const useCustomFetch = async <T>(
    url: string,
    options?: Record<string, any>
  ): Promise<T> => {
    const res = await $fetch<T>(url, {
      ...options,
      baseURL: config.public.apiUrl,
      headers: {
        ...options?.headers,
        ...(accessToken.value && {
          Authorization: `Bearer ${accessToken.value}`,
        }),
      },
      async onResponseError({ response }) {
        const errorMessage = response?._data?.message || "An error occurred";
        notify({
          type: "error",
          title: errorMessage,
        });

        if (response?.status === 401) {
          const { path } = route;
          if (path !== "/signin") {
            setAccessToken(null);
            await navigateTo(`/signin?redirect=${encodeURIComponent(path)}`);
          }
        }
      },
      async onRequestError({ error }) {
        console.error("Request error:", error);
      },
    });
    return res as T;
  };

  return {
    useCustomFetch,
  };
}
