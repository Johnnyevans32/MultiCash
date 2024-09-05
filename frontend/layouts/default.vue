<template>
  <Loading />
  <div class="min-h-screen">
    <Navbar />
    <div class="grid grid-cols-4 gap-y-4">
      <div class="col-span-4 md:col-start-2 md:col-span-2">
        <div class="grid grid-cols-1 gap-4 p-5 text-center">
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
import { notify } from "@kyvg/vue3-notification";
import { useConfigStore } from "~/store/config";
import { useUserStore } from "~/store/user";
export default defineComponent({
  setup() {
    const route = useRoute();
    const { setAccessToken } = useUserStore();
    const { autoLogoutTimeoutInMins, autoLogoutEnabled } = storeToRefs(
      useConfigStore()
    );
    const onidle = async () => {
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
    return {
      onremind,
      onidle,
      autoLogoutTimeoutInMins,
      autoLogoutEnabled,
    };
  },
});
</script>
