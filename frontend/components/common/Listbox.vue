<template>
  <div>
    <span v-if="title" class="text-sm text-left"> {{ title }}:</span>
    <div :class="customCss" class="relative">
      <Listbox v-model="selectedOption" :by="getOptionKey">
        <ListboxButton
          class="relative w-full rounded-xl border-[1px] border-base bg-lightbase text-base pl-4 pr-8 py-2 cursor-pointer"
        >
          <span>{{ getOptionLabel(selectedOption) || placeholder }}</span>
          <span
            class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"
          >
            <font-awesome-icon icon="caret-down" />
          </span>
        </ListboxButton>

        <ListboxOptions
          class="absolute w-full mt-1 bg-white border border-base rounded-xl"
        >
          <ListboxOption
            v-if="placeholder"
            :key="placeholder"
            :value="''"
            class="cursor-default relative py-2 pl-10 pr-4 bg-lightbase"
          >
            {{ placeholder }}
          </ListboxOption>
          <ListboxOption
            v-for="option in options"
            :key="getOptionKey(option)"
            :value="option"
            class="cursor-pointer relative py-2 bg-lightbase hover:bg-base"
          >
            {{ getOptionLabel(option) }}
          </ListboxOption>
        </ListboxOptions>
      </Listbox>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

export default defineComponent({
  components: {
    Listbox,
    ListboxButton,
    ListboxOptions,
    ListboxOption,
  },
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
      required: true,
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
  setup(props, { emit }) {
    const selectedOption = ref(props.selected);

    watch(selectedOption, (newVal) => {
      emit("changeOption", newVal);
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
