<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Tag" />
  </div>
  <div class="flex flex-col gap-4 text-left">
    <CommonFormInput
      inputType="text"
      v-model="tag"
      :title="`Your ${config.public.name} tag`"
    />

    <CommonButton
      text="Claim tag"
      @btn-action="updateTag"
      custom-css="!bg-blue-600 w-full text-white"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });
    const config = useRuntimeConfig();
    const { user } = storeToRefs(useUserStore());
    const { setUser } = useUserStore();
    const { $api } = useNuxtApp();
    const tag = ref(user.value?.tag || "");

    onBeforeMount(async () => {
      const user = await $api.userService.me();
      setUser(user);
    });

    const { withLoading, loading } = useLoading();

    const updateTag = async () => {
      if (!tag.value) {
        return;
      }
      await withLoading(async () => {
        await $api.userService.updateTag({
          tag: tag.value,
        });
        const user = await $api.userService.me();
        setUser(user);
        notify({
          type: "success",
          title: "tag updated",
        });
      });
    };
    return {
      loading,
      updateTag,
      tag,
      config,
    };
  },
});
</script>
