<template>
  <div>
    <font-awesome-icon class="text-7xl mb-5" icon="sack-xmark" />
    <p>Nothing to see here</p>
    <p>your currency exchanges will appear here once they arrive.</p>
  </div>
</template>
<script lang="ts">
export default defineComponent({
  setup() {
    const config = useRuntimeConfig();

    return { config };
  },
});
</script>
