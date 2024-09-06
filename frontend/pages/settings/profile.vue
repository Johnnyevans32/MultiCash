<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Profile" />
  </div>
  <div class="flex flex-col gap-4 text-left">
    <CommonFormInput inputType="text" v-model="name" />
    <CommonFormInput inputType="text" v-model="email" :disabled="true" />
    <CommonButton
      text="Save changes"
      @btn-action="updateUser"
      custom-css="!bg-blue-600 w-full text-white"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });
    const { user } = storeToRefs(useUserStore());
    const { setUser } = useUserStore();
    const { $api } = useNuxtApp();
    const email = ref(user.value?.email);
    const name = ref(user.value?.name);
    const profileImage = ref(user.value?.profileImage);

    const { withLoading, loading } = useLoading();

    const updateUser = async () => {
      await withLoading(async () => {
        await $api.userService.updateUser({
          name: name.value,
          profileImage: profileImage.value,
        });
        const user = await $api.userService.me();
        setUser(user);
        notify({
          type: "success",
          title: "user updated",
        });
      });
    };
    return {
      loading,
      updateUser,
      email,
      profileImage,
      name,
    };
  },
});
</script>
