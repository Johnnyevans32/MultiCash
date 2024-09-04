<template>
  <div :class="customCss" class="w-full bg-gray-200 rounded-xl h-2">
    <div
      :class="progressBarColor"
      class="h-full rounded-xl"
      :style="'width:' + Math.min(percentage, 100) + '%'"
    ></div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    percentage: {
      type: Number,
      required: true,
    },
    customCss: {
      type: String,
    },
  },
  setup(props: any, ctx: any) {
    const progressBarColor = computed(() => {
      if (props.percentage >= 70) {
        return "bg-[#f80000]";
      } else if (props.percentage >= 40 && props.percentage < 70) {
        return "bg-[#feed01]";
      } else {
        return "bg-green-400";
      }
    });

    return { progressBarColor };
  },
});
</script>
