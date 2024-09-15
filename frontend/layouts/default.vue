<template>
  <Loading />
  <div class="min-h-screen">
    <Navbar />

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
</template>

<script lang="ts">
import { getToken } from "firebase/messaging";
import { notify } from "@kyvg/vue3-notification";
import { useConfigStore } from "~/store/config";
import { useUserStore } from "~/store/user";
export default defineComponent({
  setup() {
    const { autoLogoutTimeoutInMins, autoLogoutEnabled } = storeToRefs(
      useConfigStore()
    );
    const onidle = async () => {
      const route = useRoute();
      const { setAccessToken } = useUserStore();
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

    onMounted(() => {
      requestPermission();
    });

    function requestPermission() {
      if (!window.Notification) return;
      if (window.Notification.permission === "granted") {
        setToken();
      } else {
        window.Notification.requestPermission((value) => {
          if (value === "granted") {
            setToken();
          }
        });
      }
    }

    async function setToken() {
      const { $messaging, $api } = useNuxtApp();
      const token = await getToken($messaging, {
        vapidKey:
          "BIARmEHojCDE1iSgKRLzAZveSlZf2RhzNFjlV0MSuUv66AKeNiP5_bTdbz4vCHXLpvwGnvhtZ3C3Pu_hRnReKI8",
      });

      await $api.userService.saveDeviceFcmToken(token);
    }

    return {
      onremind,
      onidle,
      autoLogoutTimeoutInMins,
      autoLogoutEnabled,
      requestPermission,
    };
  },
});
</script>
