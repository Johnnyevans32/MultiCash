<template>
  <NuxtLink
    class="text-sm items-center font-bold capitalize cursor-pointer"
    @click="router.back()"
  >
    <div class="flex items-center gap-1">
      <font-awesome-icon icon="arrow-left" />
      <p :class="currentPage && 'text-lightbase'">
        {{ mainPage }}
      </p>
      <p v-if="currentPage">
        /
        {{ currentPage }}
      </p>
    </div>
  </NuxtLink>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    currentPage: {
      type: String,
      default: "",
    },
    mainPage: {
      type: String,
      default: "Dashboard",
    },
  },
  setup() {
    const router = useRouter();

    return { router };
  },
});
</script>
