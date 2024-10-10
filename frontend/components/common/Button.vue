<template>
  <button
    type="button"
    @click="handleBtnClickAction"
    :disabled="disabled || loading"
    :class="`bg-lightbase ${disabled ? 'cursor-not-allowed' : ''} ${customCss}`"
    class="rounded-xl justify-between flex items-center gap-2 py-2 px-4 border-[1px] border-base"
  >
    <img
      v-if="image && imageType === 'image'"
      :src="`/${image}`"
      :alt="alt"
      loading="lazy"
      width="30"
    />
    <font-awesome-icon
      v-else-if="image && imageType === 'icon'"
      class="text-xl"
      :icon="image"
    />
    <div class="mx-auto flex items-center">
      <svg
        v-if="loading"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        class="w-6 h-6"
      >
        <g>
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.14"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.29"
            transform="rotate(30 12 12)"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.43"
            transform="rotate(60 12 12)"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.57"
            transform="rotate(90 12 12)"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.71"
            transform="rotate(120 12 12)"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            opacity="0.86"
            transform="rotate(150 12 12)"
          />
          <rect
            width="2"
            height="5"
            x="11"
            y="1"
            fill="currentColor"
            transform="rotate(180 12 12)"
          />
          <animateTransform
            attributeName="transform"
            calcMode="discrete"
            dur="0.75s"
            repeatCount="indefinite"
            type="rotate"
            values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12"
          />
        </g>
      </svg>
      <div v-else>{{ text }}</div>
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
