<template>
  <div class="flex gap-4 justify-center" @input="handleOtpInput">
    <input
      v-for="(field, index) in fields"
      :key="index"
      v-model="data[field - 1]"
      ref="firstInputEl"
      type="text"
      maxlength="1"
      class="border-2 border-base rounded-xl w-10 h-12 text-center"
      @paste="field === 1 && handlePaste($event)"
    />
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from "vue";
const props = defineProps<{
  fields: number;
}>();

const data = ref([]);
const firstInputEl = ref(null);
const emit = defineEmits(["update:modelValue"]);

watch(
  () => data,
  (newVal) => {
    if (
      newVal.value !== "" &&
      newVal.value.length === props.fields &&
      !newVal.value.includes("")
    ) {
      emit("update:modelValue", newVal.value.join(""));
    } else {
      emit("update:modelValue", null);
    }
  },
  { deep: true }
);

const handleOtpInput = (e) => {
  if (e.data && e.target.nextElementSibling) {
    e.target.nextElementSibling.focus();
  } else if (e.data == null && e.target.previousElementSibling) {
    e.target.previousElementSibling.focus();
  }
};

const handlePaste = (e) => {
  const pasteData = e.clipboardData.getData("text");
  let nextEl = firstInputEl.value[0].nextElementSibling;
  for (let i = 1; i < pasteData.length; i++) {
    if (nextEl) {
      data.value[i] = pasteData[i];
      nextEl = nextEl.nextElementSibling;
    }
  }
};
</script>
