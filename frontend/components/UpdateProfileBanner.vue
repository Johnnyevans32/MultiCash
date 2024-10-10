<template>
  <NuxtLink
    to="/settings/profile"
    class="bg-blue-600 text-white py-2 px-4 flex gap-4 justify-between items-center cursor-pointer md:text-tbase text-xs"
  >
    <span>
      Your profile is incomplete. Please complete it to unlock all features.
    </span>
    <span class="flex items-center gap-2">
      Complete profile
      <font-awesome-icon icon="arrow-up-long" :transform="{ rotate: 30 }" />
    </span>
  </NuxtLink>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    return {};
  },
});
</script>
