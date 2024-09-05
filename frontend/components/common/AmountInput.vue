<template>
  <div>
    <span v-if="title" class="text-sm"> {{ title }}:</span>
    <div class="flex items-center">
      <span
        class="bg-lightbase rounded-lg pl-5 pr-2 py-2 border-[1px] border-r-0 border-base rounded-r-none"
        >{{ currency }}</span
      >
      <CommonFormInput
        v-model="amount"
        inputType="number"
        class="w-full"
        custom-css="pl-0 border-l-0 rounded-l-none"
        :placeholder="placeholder"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    title: { type: String, required: false },
    modelValue: {},
    placeholder: { type: String, required: false },
    currency: { type: String },
  },
  emits: ["update:modelValue"],
  setup(props: any, ctx: any) {
    const amount = ref(0);

    watch(amount, () => {
      handleModelValueChangeAction();
    });

    const handleModelValueChangeAction = () =>
      ctx.emit("update:modelValue", Number(amount.value));
    return { handleModelValueChangeAction, amount };
  },
});
</script>
