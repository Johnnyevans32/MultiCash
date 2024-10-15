<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Password" />
  </div>
  <div class="flex flex-col gap-4 text-left">
    <CommonFormInput
      inputType="password"
      v-model="oldPassword"
      title="Enter your current password"
      placeholder="password"
    />
    <CommonFormInput
      inputType="password"
      v-model="newPassword"
      title="Enter your new password"
      placeholder="password"
      @keyup.enter="updatePassword"
    />
    <CommonButton
      text="Update Password"
      @btn-action="updatePassword"
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
    const { $api } = useNuxtApp();
    const { setAccessToken } = useUserStore();
    const oldPassword = ref();
    const newPassword = ref();
    const { sessionClientId } = storeToRefs(useUserStore());

    const { withLoading, loading } = useLoading();

    const updatePassword = async () => {
      await withLoading(async () => {
        await $api.userService.updatePassword({
          newPassword: newPassword.value,
          oldPassword: oldPassword.value,
        });
        $api.userService.logoutSession(sessionClientId.value);
        setAccessToken(null);
        await navigateTo("/signin");
        notify({
          type: "success",
          title: "password updated",
        });
      });
    };
    return {
      loading,
      updatePassword,
      oldPassword,
      newPassword,
    };
  },
});
</script>
