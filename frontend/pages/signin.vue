<template>
  <Logo />
  <div class="flex flex-col gap-4">
    <h1 class="text-3xl">Sign in to your account</h1>
    <p>Securely sign in to your {{ config.public.appName }}</p>
    <CommonFormInput
      inputType="email"
      v-model="email"
      title="Enter your email"
      placeholder="email"
    />
    <CommonFormInput
      inputType="password"
      v-model="password"
      title="Enter your password"
      placeholder="password"
      @keyup.enter="signin"
    />
    <CommonButton
      text="Sign in"
      @btn-action="signin"
      :loading="loading"
      custom-css="!bg-blue-600 w-full text-white"
    />
    <NuxtLink class="text-blue-600 text-sm" to="/signup"
      >Don't have an account? Register</NuxtLink
    >
    <NuxtLink class="text-blue-600 text-sm" to="/forgot-password"
      >Forgot Password?</NuxtLink
    >
    <p class="text-sm">
      Need Help?
      <a
        class="text-blue-600 cursor-pointer"
        :href="generateMailToLink()"
        target="_blank"
        >Contact {{ config.public.appName }} Support</a
      >
    </p>
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Sign in",
      ogTitle: "Sign in",
    });
    definePageMeta({
      layout: "auth",
    });

    const config = useRuntimeConfig();
    const route = useRoute();
    const { $api } = useNuxtApp();
    const { setAccessToken, setUser } = useUserStore();
    const password = ref("");
    const email = ref("");

    const { loading, withLoading } = useLoading();

    const signin = async () => {
      await withLoading(async () => {
        const token = await $api.authService.signin({
          email: email.value,
          password: password.value,
        });
        setAccessToken(token);
        const user = await $api.userService.me();
        setUser(user);
        notify({
          type: "success",
          title: "successfully logged in",
        });
        await navigateTo((route.query.redirect as string) || "/");
      });
    };

    return {
      password,
      email,
      config,
      signin,
      generateMailToLink,
      loading,
    };
  },
});
</script>
