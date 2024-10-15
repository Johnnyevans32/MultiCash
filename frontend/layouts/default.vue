<template>
  <Loading />
  <div class="min-h-screen">
    <Navbar />
    <update-profile-banner v-if="hasIncompleteProfile" />
    <no-internet v-if="!isOnline" />

    <div class="grid grid-cols-4 gap-y-4">
      <div class="col-span-4 md:col-start-2 md:col-span-2">
        <div class="grid grid-cols-1 gap-4 p-5 md:mb-0 mb-20 text-center">
          <slot />
        </div>
      </div>
    </div>
  </div>

  <v-idle
    v-if="autoLogoutEnabled"
    @idle="onidle"
    @remind="onremind"
    :loop="true"
    :reminders="[10, 15]"
    :wait="5"
    :duration="autoLogoutTimeoutInMins * 60"
  />

  <onboarding-features
    :open="hasShownFeaturesModal"
    @change-modal-status="
      (val) => {
        hasShownFeaturesModal = val;
      }
    "
  />
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useConfigStore } from "~/store/config";
import { useUserStore } from "~/store/user";
import Intercom from "@intercom/messenger-js-sdk";

export default defineComponent({
  setup() {
    const { autoLogoutTimeoutInMins, autoLogoutEnabled } = storeToRefs(
      useConfigStore()
    );
    const { $api } = useNuxtApp();
    const { user, sessionClientId } = storeToRefs(useUserStore());

    let heartbeatInterval: number | null = null;

    onMounted(() => {
      heartbeatInterval = window.setInterval(() => {
        $api.userService.userSessionPing(sessionClientId.value);
      }, 1 * 60 * 1000); // Every 1 minutes
    });

    onUnmounted(() => {
      if (heartbeatInterval !== null) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    });

    onMounted(() => {
      Intercom({
        app_id: "ma6omd0w",
        name: user.value?.name,
        email: user.value?.email,
        user_hash: user.value?.intercomHash,
      });
    });

    const hasShownFeaturesModal = ref(false);

    const hasIncompleteProfile = computed(() => {
      return (
        !user.value?.name ||
        !user.value?.profileImage ||
        !user.value?.country ||
        !user.value?.did
      );
    });

    const isOnline = ref(navigator.onLine);

    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine;
    };

    onMounted(() => {
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    });

    const onidle = async () => {
      const route = useRoute();
      const { setAccessToken } = useUserStore();
      $api.userService.logoutSession(sessionClientId.value);
      setAccessToken(null);
      await navigateTo(`/signin?redirect=${route.fullPath}`);
      notify({
        type: "info",
        title: "You have been logged out",
      });
    };

    const onremind = (time: number) => {
      notify({
        type: "info",
        title: `We care about your security! To ensure the safety of your account, you will be automatically logged out if there is no activity detected for ${time} seconds. Please stay active to avoid being logged out.`,
      });
    };

    onBeforeMount(() => {
      handleNotificationPermissionRequest();
    });

    const handleNotificationPermissionRequest = async () => {
      const permissionGranted = await requestNotificationPermission();

      const { setUser } = useUserStore();
      await $api.userService.updateUser({
        pushNotificationIsEnabled: permissionGranted,
      });
      const user = await $api.userService.me();
      setUser(user);
    };

    return {
      onremind,
      onidle,
      autoLogoutTimeoutInMins,
      autoLogoutEnabled,
      hasIncompleteProfile,
      isOnline,
      hasShownFeaturesModal,
    };
  },
});
</script>
