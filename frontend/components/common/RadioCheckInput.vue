<template>
  <RadioGroup v-model="selectedOption" class="text-left space-y-1">
    <RadioGroupLabel>Select {{ name }}:</RadioGroupLabel>
    <div class="space-y-2">
      <RadioGroupOption
        as="template"
        v-for="option in options"
        :key="option"
        :value="option"
        v-slot="{ checked }"
      >
        <div
          class="cursor-pointer rounded-xl flex items-center justify-between px-5 py-1 w-full border-[1px] border-base bg-lightbase"
        >
          <RadioGroupLabel as="p" class="text-base">
            {{ option.replaceAll("-", " ") }}
          </RadioGroupLabel>

          <div class="text-2xl">
            <font-awesome-icon v-if="checked" icon="circle-check" />
            <font-awesome-icon v-else icon="fa-regular fa-circle" />
          </div>
        </div>
      </RadioGroupOption>
    </div>
  </RadioGroup>
</template>

<script lang="ts">
import {
  RadioGroup,
  RadioGroupLabel,
  RadioGroupDescription,
  RadioGroupOption,
} from "@headlessui/vue";

export default defineComponent({
  components: {
    RadioGroup,
    RadioGroupLabel,
    RadioGroupDescription,
    RadioGroupOption,
  },
  emits: ["changeOption"],
  props: {
    options: {
      type: Array as PropType<string[]>,
      default: [],
    },
    name: {
      type: String,
    },
    selected: {
      type: String,
    },
  },
  setup(props, ctx) {
    const selectedOption = ref(props.selected || props.options[0]);

    watch(selectedOption, (newVal, prevVal) => {
      ctx.emit("changeOption", newVal);
    });

    return {
      selectedOption,
    };
  },
});
</script>
