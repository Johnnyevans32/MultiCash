<template>
  <Logo />
  <div class="flex flex-col gap-4">
    <h1 class="text-3xl">Create a {{ config.public.appName }} account</h1>
    <p>Welcome to the future of multi currency exchange</p>
    <CommonFormInput
      inputType="text"
      v-model="name"
      title="Enter your name"
      placeholder="name"
    />
    <CommonFormSelect
      title="Select bank"
      :selected="country"
      :options="SupportedCountries"
      @change-option="
        (val) => {
          country = val;
        }
      "
      labelKey="name"
      placeholder="-- Please select your country --"
      valueKey="code"
    />
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
      @keyup.enter="signup"
    />
    <CommonButton
      text="Create Account"
      @btn-action="signup"
      :loading="loading"
      custom-css="!bg-blue-600 w-full text-white"
    />
    <NuxtLink class="text-blue-600 text-sm" to="/signin"
      >Already have an account? Signin In</NuxtLink
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
import { SupportedCountries } from "~/types/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Create an account",
      ogTitle: "Create an account",
    });
    definePageMeta({
      layout: "auth",
    });

    const config = useRuntimeConfig();
    const { $api } = useNuxtApp();
    const password = ref("");
    const email = ref("");
    const name = ref("");
    const country = ref("");

    const { loading, withLoading } = useLoading();

    const signup = async () => {
      await withLoading(async () => {
        await $api.authService.signup({
          email: email.value,
          password: password.value,
          name: name.value,
          country: country.value,
        });
        notify({
          type: "success",
          title: "successfully created account",
        });
        await navigateTo("/signin");
      });
    };

    return {
      password,
      email,
      name,
      config,
      signup,
      generateMailToLink,
      loading,
      country,
      SupportedCountries,
    };
  },
});
</script>
