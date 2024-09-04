<template>
  <Logo />
  <div class="flex flex-col gap-4">
    <h1 class="text-4xl">Reset your password?</h1>

    <CommonFormInput
      inputType="password"
      v-model="password"
      title="Enter your new password"
      placeholder="password"
      @keyup.enter="resetPassword"
    />
    <CommonButton
      text="Reset password"
      @btn-action="resetPassword"
      custom-css="!bg-blue-400 w-full text-black"
      :loading="loading"
    />
    <NuxtLink class="text-blue-600 text-sm" to="/signin"
      >Remember password? Sign In</NuxtLink
    >
  </div>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Reset Password",
      ogTitle: "Reset Password",
    });

    definePageMeta({
      layout: "auth",
    });
    const route = useRoute();
    const resetToken = route.params.token as string;
    const config = useRuntimeConfig();
    const password = ref("");
    const { $api } = useNuxtApp();
    const resetPasswordCode = ref(null);

    const { withLoading, loading } = useLoading();

    const resetPassword = async () => {
      await withLoading(async () => {
        await $api.authService.resetPassword({
          newPassword: password.value,
          token: resetToken,
        });
        await navigateTo("/signin");
      });
    };

    return {
      config,
      password,
      resetPassword,
      resetPasswordCode,
      loading,
    };
  },
});
</script>
