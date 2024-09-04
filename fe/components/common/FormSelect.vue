<template>
  <div class="text-left">
    <span v-show="title" class="text-sm"> {{ title }}:</span>
    <div :class="customCss" class="flex justify-end items-center">
      <select
        v-model="selectedOption"
        class="rounded-xl border-[1px] border-base bg-lightbase text-base pl-5 pr-8 py-2 w-full cursor-pointer appearance-none"
      >
        <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionKey(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      <font-awesome-icon icon="caret-down" class="absolute mr-5" />
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  emits: ["changeOption"],
  props: {
    title: { type: String },
    placeholder: { type: String },
    options: {
      type: Array as PropType<(string | Record<string, any>)[]>,
      default: () => [],
    },
    selected: {
      type: [String, Object],
    },
    customCss: {
      type: String,
    },
    labelKey: {
      type: String,
      default: "label", // default key to access the label in objects
    },
    valueKey: {
      type: String,
      default: "value", // default key to access the value in objects
    },
  },
  setup(props, ctx) {
    const selectedOption = ref(props.selected);

    watch(selectedOption, (newVal) => {
      console.log(newVal);
      ctx.emit("changeOption", newVal);
    });

    const getOptionLabel = (option: string | Record<string, any>) => {
      return typeof option === "string"
        ? option.replaceAll("_", " ")
        : option[props.labelKey]?.replaceAll("_", " ") || "";
    };

    const getOptionValue = (option: string | Record<string, any>) => {
      return typeof option === "string" ? option : option[props.valueKey];
    };

    const getOptionKey = (option: string | Record<string, any>) => {
      return typeof option === "string" ? option : option[props.valueKey];
    };

    return {
      selectedOption,
      getOptionLabel,
      getOptionValue,
      getOptionKey,
    };
  },
});
</script>
