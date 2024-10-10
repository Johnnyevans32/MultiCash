<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Profile" />
  </div>
  <div class="flex flex-col gap-4 text-left">
    <div class="flex flex-col items-center">
      <div @click="triggerFileInput" class="relative cursor-pointer group">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept="image/*"
          class="hidden"
        />
        <CommonImage
          :image="profileImage || `https://robohash.org/${email}`"
          alt="avatar"
          type="image"
          custom-css="w-28 h-28 rounded-xl border border-base bg-lightbase"
        />
        <div
          class="absolute inset-0 flex items-center justify-center rounded-xl bg-black bg-opacity-50"
        >
          <font-awesome-icon icon="camera" class="text-white text-2xl" />
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

  <CommonModal
    :open="editImageModal"
    title="Edit image"
    @change-modal-status="cancelEdit"
  >
    <template v-slot:content>
      <div v-if="editImageModal" class="cropper-container w-full max-h-[70vh]">
        <img ref="imagePreview" :src="profileImage" alt="Image Preview" />
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Cancel"
        @btn-action="cancelEdit"
        custom-css="bg-base text-base  w-full"
      />
      <CommonButton
        text="Apply"
        @btn-action="editImage"
        custom-css="!bg-green-600 text-white  w-full"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";
import { SupportedCountries } from "~/types/user";
import Cropper from "cropperjs";

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
    const country = ref(user.value?.country);
    const did = ref(user.value?.did);

    onBeforeMount(async () => {
      const user = await $api.userService.me();
      setUser(user);
    });

    const { withLoading, loading } = useLoading();
    const profileImage = ref(user.value?.profileImage);
    const updateUser = async () => {
      await withLoading(async () => {
        let uploadedImageUrl = profileImage.value;

        if (file.value && profileImage.value) {
          uploadedImageUrl = await uploadFile(
            profileImage.value,
            file.value.type,
            file.value.name
          );
          file.value = null;
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
    const triggerFileInput = () => {
      fileInput.value!.value = null;
      fileInput.value!.click();
    };

    const file = ref<File | null>(null);
    const handleFileUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        file.value = target.files[0];
        profileImage.value = await convertFileToBase64(file.value);
        editImageModal.value = true;
      }
    };

    const editImageModal = ref(false);
    const cropper = ref<Cropper | null>(null);
    const imagePreview = ref<HTMLImageElement | null>(null);

    const editImage = () => {
      if (cropper.value && imagePreview.value) {
        const canvas = cropper.value.getCroppedCanvas();
        profileImage.value = canvas.toDataURL("image/jpeg");
        editImageModal.value = false;
      }
    };

    const cancelEdit = () => {
      editImageModal.value = false;
      if (cropper.value) {
        cropper.value.destroy();
        cropper.value = null;
      }
    };

    const initializeCropper = () => {
      if (imagePreview.value && editImageModal.value) {
        cropper.value = new Cropper(imagePreview.value, {
          aspectRatio: 1,
          viewMode: 3,
          dragMode: "move",
          background: false,
        });
      }
    };

    watch(
      () => editImageModal.value,
      (newVal: any) => {
        if (newVal) {
          nextTick(() => initializeCropper());
        } else if (cropper.value) {
          cropper.value.destroy();
          cropper.value = null;
        }
      }
    );

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
      editImageModal,
      editImage,
      cancelEdit,
      imagePreview,
      cropper,
      triggerFileInput,
    };
  },
});
</script>
