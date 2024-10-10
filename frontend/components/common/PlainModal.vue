<template>
  <div class="flex items-center justify-center">
    <TransitionRoot as="template" :show="open">
      <Dialog
        as="div"
        class="fixed inset-0 z-10 overflow-y-auto"
        @close="closeModal"
      >
        <div
          class="flex min-h-screen items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay
              class="fixed inset-0 bg-base bg-opacity-70 transition-opacity"
            />
          </TransitionChild>

          <span
            class="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
            >&#8203;</span
          >

          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              :class="appThemeColor"
              class="bg-lightbase text-base rounded-xl text-left overflow-hidden shadow-xl transform transition-all w-full sm:max-w-lg"
            >
              <font-awesome-icon
                icon="xmark"
                class="absolute top-2 right-2 text-lightbase hover:text-base focus:outline-none"
                @click="closeModal"
              />

              <slot name="image"></slot>
              <slot name="content"></slot>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script lang="ts">
import {
  Dialog,
  DialogOverlay,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { useConfigStore } from "~/store/config";

export default defineComponent({
  components: {
    Dialog,
    DialogOverlay,
    TransitionChild,
    TransitionRoot,
  },
  props: {
    open: {
      type: Boolean,
    },
  },
  emits: ["changeModalStatus"],
  setup(prop: any, ctx: any) {
    const { appThemeColor } = storeToRefs(useConfigStore());

    const closeModal = () => ctx.emit("changeModalStatus", false);

    return { closeModal, appThemeColor };
  },
});
</script>
