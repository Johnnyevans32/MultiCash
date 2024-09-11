<template>
  <div class="flex justify-center gap-2">
    <font-awesome-icon
      v-for="n in maxRating"
      :key="n"
      :icon="hoverRating >= n ? ['fas', 'star'] : ['far', 'star']"
      @click="setRating(n)"
      @mouseover="hoverRating = n"
      @mouseleave="hoverRating = rating"
      class="cursor-pointer text-3xl"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
  modelValue: number;
  maxRating: number;
}>();

const emit = defineEmits(["update:modelValue"]);
const rating = ref(props.modelValue || 0);
const hoverRating = ref(rating.value);

const setRating = (value: number) => {
  rating.value = value;
  console.log({ value });
  emit("update:modelValue", rating.value);
};
</script>
