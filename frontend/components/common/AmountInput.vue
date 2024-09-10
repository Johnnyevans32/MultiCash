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
        :min="min"
        :max="max"
      />
    </div>

    <span v-if="balance !== undefined" class="text-tiny text-red-600"
      >Wallet Balance: {{ currency }} {{ formatMoney(balance, 10) }}</span
    >
  </div>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    title: { type: String, required: false },
    modelValue: {},
    placeholder: { type: String, required: false },
    currency: { type: String },
    balance: { type: Number },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
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
