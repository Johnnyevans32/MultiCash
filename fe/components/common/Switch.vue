<template>
  <Switch
    v-model="enabled"
    :class="selected ? 'bg-base' : 'bg-lightbase'"
    class="flex p-1 w-12 h-7 items-center rounded-xl border-[1px] border-base"
  >
    <span class="sr-only">Enable notifications</span>
    <font-awesome-icon
      icon="circle"
      :class="selected ? 'translate-x-full' : 'translate-x-0'"
      class="h-5 w-5 transform text-base transition"
    />
  </Switch>
</template>

<script lang="ts">
import { Switch } from "@headlessui/vue";

export default defineComponent({
  components: {
    Switch,
  },
  emits: ["changeOption"],
  props: {
    selected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx) {
    const enabled = ref(props.selected);

    watch(enabled, (newVal) => {
      ctx.emit("changeOption", newVal);
    });

    return {
      enabled,
    };
  },
});
</script>
