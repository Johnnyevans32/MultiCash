<template>
  <div class="flex items-center justify-center">
    <TransitionRoot as="template" :show="open">
      <Dialog
        as="div"
        class="fixed inset-0 z-10 overflow-y-auto"
        @close="closeModal"
      >
        <div
          class="flex min-h-screen items-end justify-center text-center sm:block sm:p-0"
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

          <!-- This element is to trick the browser into centering the modal contents. -->
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
              class="text-base inline-block transform overflow-hidden h-full w-[50rem] text-left shadow-xl rounded-xl transition-all sm:align-middle"
            >
              <div
                class="border-b-[1px] border-base rounded-t-xl px-4 py-2 bg-bgbase flex items-center justify-between"
              >
                <p class="font-black">
                  {{ title }}
                </p>
                <font-awesome-icon
                  icon="xmark"
                  class="bg-lightbase rounded-lg h-5 w-5 p-1 cursor-pointer"
                  @click="closeModal"
                />
              </div>
              <div class="px-4 py-2 bg-bgbase">
                <slot name="content"></slot>
              </div>
              <div
                class="border-t-[1px] border-base md:rounded-b-xl px-4 py-2 bg-bgbase flex gap-2"
              >
                <slot name="footer"></slot>
              </div>
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
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { useConfigStore } from "~/store/config";

export default defineComponent({
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  },
  props: {
    open: {
      type: Boolean,
    },
    title: {
      type: String,
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
