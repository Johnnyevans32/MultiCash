<template>
  <button
    type="button"
    @click="handleBtnClickAction"
    :disabled="disabled || loading"
    :class="`${disabled && 'cursor-not-allowed'} ${customCss}`"
    class="rounded-xl justify-between flex items-center gap-2 py-2 px-4 border-[1px] border-base bg-lightbase"
  >
    <img
      v-show="image && imageType === 'image'"
      :src="`/${image}`"
      :alt="alt"
      loading="lazy"
      width="30"
    />
    <font-awesome-icon
      v-show="image && imageType === 'icon'"
      class="text-xl"
      :icon="image"
    />
    <div class="mx-auto flex items-center">
      <svg
        v-show="loading"
        aria-hidden="true"
        role="status"
        class="inline mr-2 w-6 h-6 text-gray-300 animate-spin dark:text-gray-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        ></path>
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="#1F2937"
        ></path>
      </svg>
      <div v-show="!loading">{{ text }}</div>
    </div>
  </button>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    text: {
      type: String,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    image: {
      type: String,
      required: false,
    },
    imageType: {
      type: String,
      required: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    alt: {
      type: String,
      required: false,
      default: "image",
    },
    customCss: {
      type: String,
      required: false,
    },
  },
  emits: ["btnAction"],
  setup(props: any, ctx: any) {
    const handleBtnClickAction = () => ctx.emit("btnAction");

    return { handleBtnClickAction };
  },
});
</script>
