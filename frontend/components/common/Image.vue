<template>
  <div
    v-if="type === 'icon'"
    :class="customCss"
    class="h-10 w-10 p-2 rounded-xl cursor-pointer bg-bgbase text-2xl flex items-center justify-center border-[1px] border-base"
  >
    <font-awesome-icon :icon="image" />
  </div>

  <img
    v-else-if="type === 'image' && image"
    :src="image"
    :class="customCss"
    class="w-10 h-10 rounded-xl justify-self-center"
    :alt="alt"
  />

  <div
    v-else
    :class="customCss"
    class="bg-base h-10 w-10 text-lightbase rounded-xl flex items-center justify-center text-xl"
  >
    {{ alt?.split("")[0] || "?" }}
  </div>
</template>
<script lang="ts">
export default defineComponent({
  props: {
    customCss: { type: String },
    type: {
      type: String,
      default: "image",
      validator: (value: string) => ["icon", "image"].includes(value),
    },
    image: {
      type: String,
    },
    alt: {
      type: String,
    },
  },
  setup(props, ctx) {
    return {};
  },
});
</script>
