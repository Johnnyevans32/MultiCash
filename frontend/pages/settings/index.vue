<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" />
  </div>
  <img
    :src="user?.profileImage || `https://robohash.org/${user?.email}`"
    alt="avatar"
    class="w-28 h-28 rounded-xl justify-self-center border-[1px] border-base bg-lightbase"
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
    title="Confirm data deletion from platform"
    desc="Are you sure you want to delete all your data associated with this platfrom?"
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
    const confirmDeletionModal = ref(false);

    const settingsItems = ref([
      {
        logo: "user",
        action: "profile",
        value: "your account information",
        logoType: "icon",
        href: "/settings/profile",
      },
      {
        logo: "shield-halved",
        action: "guard",
        value: "manage settings to guard your data",
        logoType: "icon",
        href: "/settings/guard",
      },
      {
        logo: "fa-solid fa-palette",
        action: "theme",
        value: appThemeColor.value,
        logoType: "icon",
        href: "/settings/theme",
      },
      {
        logo: "fa-solid fa-bug",
        action: "report an issue",
        value: "we will respond as soon as we can 👨🏽‍🔧",
        logoType: "icon",
        external: true,
        href: generateMailToLink(),
      },
      {
        logo: "radiation",
        action: "delete user account",
        value: "delete all your data associated with this platform",
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
