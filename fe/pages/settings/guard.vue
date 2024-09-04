<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Guard" />
  </div>
  <div class="flex justify-between items-start">
    <div class="text-left">
      <p class="font-bold">Enable Guard Screen</p>
      <p class="text-sm">
        Enable guard screen to protect your account from unauthorized access.
        You will be logged out after a period of inactivity.
      </p>
    </div>
    <div class="w-40 flex justify-end">
      <CommonSwitch
        @change-option="handleAutoLogoutSwitchChange"
        :selected="autoLogoutEnabled"
      />
    </div>
  </div>
  <div class="flex flex-col gap-4 text-left">
    <CommonFormInput
      inputType="number"
      v-model="inactivityTimeoutInMins"
      title="Enter Inactivity Timeout (Minutes)"
      placeholder="Enter timeout in minutes"
      :min="1"
      :max="10"
    />
    <CommonButton
      text="Save changes"
      @btn-action="saveInactivityTimeout"
      custom-css="!bg-blue-400 w-full text-black"
    />
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useConfigStore } from "~/store/config";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });

    const { autoLogoutEnabled, autoLogoutTimeoutInMins } = storeToRefs(
      useConfigStore()
    );

    const { setAutoLogoutEnabled, setAutoLogoutTimeoutInMins } =
      useConfigStore();
    const inactivityTimeoutInMins = ref(autoLogoutTimeoutInMins.value);

    const handleAutoLogoutSwitchChange = async (newVal: boolean) => {
      setAutoLogoutEnabled(newVal);
    };

    const saveInactivityTimeout = () => {
      setAutoLogoutTimeoutInMins(inactivityTimeoutInMins.value);
      notify({
        type: "success",
        title: "settings updated",
      });
    };

    return {
      autoLogoutEnabled,
      handleAutoLogoutSwitchChange,
      inactivityTimeoutInMins,
      saveInactivityTimeout,
    };
  },
});
</script>
