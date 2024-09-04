export function useLoading() {
  const loading = ref(false);

  const withLoading = async (action: () => Promise<void>) => {
    loading.value = true;
    try {
      await action();
    } finally {
      loading.value = false;
    }
  };

  const withLoadingPromise = async <T>(
    promise: Promise<T>,
    loadingRef: Ref<boolean>
  ): Promise<T> => {
    loadingRef.value = true;
    try {
      return await promise;
    } finally {
      loadingRef.value = false;
    }
  };

  return {
    loading,
    withLoading,
    withLoadingPromise,
  };
}
