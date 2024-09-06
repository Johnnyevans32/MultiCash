<template>
  <CommonModal
    :open="open"
    :title="title"
    @change-modal-status="changeModalStatus"
  >
    <template v-slot:content>
      <p>{{ desc }}</p>
    </template>
    <template v-slot:footer>
      <CommonButton
        text="Confirm"
        @btn-action="handleBtnClickAction"
        custom-css="bg-red-600 w-full text-white"
        :loading="loading"
      />
      <CommonButton
        text="Cancel"
        @btn-action="changeModalStatus(false)"
        custom-css="!bg-green-600 w-full text-white"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import { notify } from "@kyvg/vue3-notification";

export default defineComponent({
  props: {
    open: {
      type: Boolean,
    },
    desc: {
      type: String,
    },
    title: {
      type: String,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["changeModalStatus", "confirmModalAction"],
  setup(props: any, ctx: any) {
    const changeModalStatus = (value: boolean) => {
      if (props.loading) {
        notify({
          type: "info",
          title: "you cant close modal while an action is in progress",
        });
        return;
      }
      ctx.emit("changeModalStatus", value);
    };

    const handleBtnClickAction = () => ctx.emit("confirmModalAction");

    return { changeModalStatus, handleBtnClickAction };
  },
});
</script>
