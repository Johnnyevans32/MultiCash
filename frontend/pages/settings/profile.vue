<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Profile" />
  </div>
  <div class="flex flex-col gap-4 text-left">
    <div class="flex flex-col">
      <div class="flex flex-col items-center">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept="image/*"
          class="hidden"
        />
        <div @click="fileInput?.click()" class="cursor-pointer">
          <CommonImage
            :image="profileImage || `https://robohash.org/${email}`"
            alt="avatar"
            type="image"
            custom-css="w-28 h-28 rounded-xl justify-self-center border-[1px] border-base bg-lightbase"
          />
        </div>
      </div>
    </div>
    <CommonFormInput inputType="text" v-model="name" title="Your Name" />
    <CommonFormInput inputType="text" v-model="did" title="Your DID" />
    <CommonFormInput
      inputType="text"
      v-model="email"
      :disabled="true"
      title="Your Email"
    />

    <CommonFormSelect
      title="Your Country"
      :selected="country"
      :options="SupportedCountries"
      labelKey="name"
      valueKey="code"
      :disabled="true"
    />
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
import { SupportedCountries } from "~/types/user";
import { convertFileToBase64, uploadFile } from "~/utils";

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
    const country = ref(user.value?.country);
    const did = ref(user.value?.did);

    onBeforeMount(async () => {
      const user = await $api.userService.me();
      setUser(user);
    });

    const { withLoading, loading } = useLoading();

    const updateUser = async () => {
      await withLoading(async () => {
        let uploadedImageUrl = profileImage.value;

        if (file.value) {
          uploadedImageUrl = await uploadFile(file.value);
        }
        await $api.userService.updateUser({
          name: name.value,
          profileImage: uploadedImageUrl,
          did: did.value,
        });
        const user = await $api.userService.me();
        setUser(user);
        notify({
          type: "success",
          title: "user updated",
        });
      });
    };

    const fileInput = ref<HTMLInputElement | null>(null);
    const file = ref<File | null>(null);
    const handleFileUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        file.value = target.files[0];
        profileImage.value = await convertFileToBase64(file.value);
      }
    };

    return {
      loading,
      updateUser,
      email,
      profileImage,
      name,
      country,
      did,
      SupportedCountries,
      handleFileUpload,
      fileInput,
    };
  },
});
</script>
