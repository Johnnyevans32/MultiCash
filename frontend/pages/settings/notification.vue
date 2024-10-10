<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Notifications" />
  </div>
  <div class="flex justify-between items-start">
    <div class="text-left">
      <p class="font-bold">Enable Push Notification</p>
      <p class="text-sm">
        Enable push notifications to receive real-time alerts about your
        transactions and exchange updates. Stay informed and make timely
        decisions to manage your finances effectively.
      </p>
    </div>
    <div class="w-40 flex justify-end">
      <CommonSwitch
        @change-option="togglePushNotifications"
        :selected="pushNotificationIsEnabled"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    const { user } = storeToRefs(useUserStore());

    const pushNotificationIsEnabled = ref(
      user.value?.pushNotificationIsEnabled
    );
    const togglePushNotifications = async (status: boolean) => {
      pushNotificationIsEnabled.value =
        status && (await requestNotificationPermission());
      await updateUser();
    };

    const updateUser = async () => {
      const { $api } = useNuxtApp();
      const { setUser } = useUserStore();

      await $api.userService.updateUser({
        pushNotificationIsEnabled: pushNotificationIsEnabled.value,
      });

      const user = await $api.userService.me();
      setUser(user);
    };

    return {
      pushNotificationIsEnabled,
      togglePushNotifications,
    };
  },
});
</script>
