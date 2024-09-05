<template>
  <div class="text-left">
    <span v-if="title" class="text-sm"> {{ title }}:</span>
    <input
      :type="inputType"
      :value="modelValue"
      @input="handleModelValueChangeAction($event)"
      :placeholder="placeholder"
      :class="`${customCss} rounded-xl px-5 py-2 bg-lightbase w-full border-[1px]
    border-base`"
      :disabled="disabled"
      :min="min"
      :max="max"
    />
    <span
      v-if="validationMessage"
      :class="isErrorMessage ? `text-red-600` : `text-green-600`"
    >
      {{ validationMessage }}
    </span>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    inputType: {
      type: String,
      default: "text",
    },
    title: { type: String, required: false },
    modelValue: {},
    placeholder: { type: String, required: false },
    customCss: {
      type: String,
      required: false,
    },
    isErrorMessage: {
      type: Boolean,
      default: true,
    },
    validationMessage: {
      type: String,
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
  },
  emits: ["update:modelValue"],
  setup(props, ctx) {
    const handleModelValueChangeAction = (event: any) =>
      ctx.emit(
        "update:modelValue",
        props.inputType === "number"
          ? Number(event?.target?.value)
          : event?.target?.value
      );
    return { handleModelValueChangeAction };
  },
});
</script>

<style scoped>
input[type="search"] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' class='bi bi-search' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 13px;
}
</style>
