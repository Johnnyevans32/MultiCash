<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" />
  </div>

  <CommonImage
    :image="user?.profileImage || `https://robohash.org/${user?.email}`"
    alt="avatar"
    type="image"
    custom-css="w-28 h-28 rounded-xl justify-self-center border-[1px] border-base bg-lightbase"
  />

  <div class="flex flex-col gap-2">
    <NuxtLink
      v-for="setting in settingsItems"
      :key="setting.action"
      :to="setting.href"
      @click="setting.settingAction"
      :target="setting.external ? '_blank' : ''"
      :class="setting.customCss"
      class="cursor-pointer flex items-center justify-between px-5 py-2 rounded-xl text-base bg-lightbase border-[1px] border-base"
    >
      <div class="flex space-x-2 items-center">
        <div class="w-5">
          <font-awesome-icon
            v-if="setting.logoType === 'icon'"
            :icon="setting.logo"
          />
          <img v-else :src="setting.logo" alt="qr" class="w-10 rounded-xl" />
        </div>
        <div class="flex flex-col text-left">
          <span class="font-bold">{{ setting.action }}</span>
          <span class="text-sm line-clamp-1">{{ setting.value }}</span>
        </div>
      </div>
      <font-awesome-icon icon="arrow-right" />
    </NuxtLink>
  </div>
  <CommonConfirmationModal
    :open="confirmDeletionModal"
    title="Confirm account deactivation"
    desc="Are you sure you want to deactivate your account? This will remove access to all your data associated with this platform."
    :loading="loading"
    @change-modal-status="(value) => (confirmDeletionModal = value)"
    @confirm-modal-action="deleteUser"
  />
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useConfigStore } from "~/store/config";
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });
    const { user } = storeToRefs(useUserStore());
    const { $api } = useNuxtApp();
    const { appThemeColor } = storeToRefs(useConfigStore());
    const { setAccessToken } = useUserStore();
    const { loading, withLoading } = useLoading();
    const config = useRuntimeConfig();
    const confirmDeletionModal = ref(false);

    const logout = async () => {
      setAccessToken(null);
      await navigateTo("/signin");
      notify({
        type: "info",
        title: "you have been logged out",
      });
    };

    const settingsItems = ref([
      {
        logo: "at",
        action: `${config.public.appName} tag`,
        value: user.value?.tag ? `@${user.value?.tag}` : "Not set",
        logoType: "icon",
        href: "/settings/tag",
      },
      {
        logo: "user",
        action: "Profile",
        value: "See your account information.",
        logoType: "icon",
        href: "/settings/profile",
      },
      {
        logo: "key",
        action: "Change your password",
        value: "Change your password at any time.",
        logoType: "icon",
        href: "/settings/password",
      },
      {
        logo: "shield-halved",
        action: "Guard",
        value: "Manage settings to guard your data.",
        logoType: "icon",
        href: "/settings/guard",
      },
      {
        logo: "fa-solid fa-palette",
        action: "Theme",
        value: appThemeColor.value,
        logoType: "icon",
        href: "/settings/theme",
      },

      {
        logo: "fa-solid fa-bug",
        action: "Report an issue",
        value: "We will respond as soon as we can.",
        logoType: "icon",
        external: true,
        href: generateMailToLink(),
      },
      {
        logo: "right-from-bracket",
        action: "Logout",
        value: "You will be signed out of your account.",
        logoType: "icon",
        settingAction: logout,
      },
      {
        logo: "radiation",
        action: "Deactivate your account",
        value: "This will deactivate your account.",
        logoType: "icon",
        customCss: "bg-red-400",
        settingAction: () => (confirmDeletionModal.value = true),
      },
    ]);

    const deleteUser = async () => {
      await withLoading(async () => {
        try {
          await $api.userService.deleteUser();

          setAccessToken(null);
          notify({
            type: "success",
            title: "data deleted",
          });
          await navigateTo("/signin");
        } finally {
          confirmDeletionModal.value = false;
        }
      });
    };

    return {
      settingsItems,
      user,
      deleteUser,
      confirmDeletionModal,
      loading,
    };
  },
});
</script>
