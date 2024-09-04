<template>
  <Logo />
  <div class="flex flex-col gap-4">
    <h1 class="text-4xl">Forgot your password?</h1>
    <p>Enter your email to reset your password</p>
    <CommonFormInput
      inputType="email"
      v-model="email"
      title="Enter your email"
      placeholder="email"
      @keyup.enter="forgotPassword"
    />
    <CommonButton
      text="Request reset"
      @btn-action="forgotPassword"
      custom-css="!bg-blue-400 w-full text-black"
    />
    <NuxtLink class="text-blue-600 text-sm" to="/signin"
      >Remember Password? Sign In</NuxtLink
    >
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Forgot Password",
      ogTitle: "Forgot Password",
    });

    definePageMeta({
      layout: "auth",
    });
    const config = useRuntimeConfig();
    const { $api } = useNuxtApp();
    const email = ref("");

    const forgotPassword = async () => {
      await $api.authService.forgotPassword(email.value);
      notify({
        type: "success",
        title: `reset password code sent to your email if it exists on ${config.public.appName}`,
      });
    };

    return {
      config,
      email,
      forgotPassword,
    };
  },
});
</script>
