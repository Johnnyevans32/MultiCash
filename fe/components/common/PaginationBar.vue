<template>
  <div class="example-six grid justify-center">
    <vue-awesome-paginate
      :total-items="totalItems"
      v-model="selectedOption"
      :items-per-page="itemsPerPage"
      :max-pages-shown="1"
    >
      <template #prev-button>
        <font-awesome-icon icon="arrow-right" />
      </template>

      <template #next-button>
        <font-awesome-icon icon="arrow-right" />
      </template>
    </vue-awesome-paginate>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  emits: ["changeOption"],
  props: {
    currentPage: {
      type: Number,
    },
    totalItems: {
      type: Number,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
  },
  setup(props, ctx) {
    const selectedOption = ref(props.currentPage || 1);
    watch(selectedOption, (newVal, prevVal) => {
      ctx.emit("changeOption", newVal);
    });
    return { selectedOption };
  },
});
</script>
<style>
.example-six .pagination-container {
  @apply flex gap-2;
}
.example-six .paginate-buttons {
  @apply bg-lightbase rounded-xl h-10 w-10 p-2;
}

.example-six .back-button,
.example-six .next-button {
  @apply bg-lightbase rounded-xl text-base;
}
.example-six .active-page {
  @apply bg-base text-lightbase;
}
.example-six .paginate-buttons:hover {
  @apply bg-hoverlightbase;
}
.example-six .active-page:hover {
  @apply bg-hoverlightbase text-base;
}

.example-six .back-button svg {
  transform: rotate(180deg) translateY(-2px);
}

.example-six .back-button:hover,
.example-six .next-button:hover {
  @apply bg-hoverlightbase;
}
</style>
