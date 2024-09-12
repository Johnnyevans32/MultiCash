<template>
  <TabGroup :selectedIndex="activeTab" @change="changeTab">
    <TabList class="flex rounded-xl w-full bg-lightbase p-2">
      <Tab
        v-for="tab in tabs"
        :key="tab.title"
        as="template"
        v-slot="{ selected }"
      >
        <div
          :class="[
            'w-full rounded-xl py-1 cursor-pointer ',
            selected && 'bg-base shadow',
          ]"
        >
          {{ tab.title }}
        </div>
      </Tab>
    </TabList>
    <TabPanels class="mt-4">
      <TabPanel v-for="tab in tabs" :key="tab.title">
        <component :is="tab.content" />
      </TabPanel>
    </TabPanels>
  </TabGroup>
</template>

<script lang="ts">
import { TabGroup, TabList, TabPanels, TabPanel, Tab } from "@headlessui/vue";

export default defineComponent({
  components: {
    TabGroup,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  },
  props: {
    tabs: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Number,
      default: null,
    },
  },
  setup(props, { emit }) {
    const activeTabInternal = ref(0);

    const activeTab = computed({
      get: () =>
        props.modelValue !== null ? props.modelValue : activeTabInternal.value,
      set: (value) => {
        if (props.modelValue !== null) {
          emit("update:modelValue", value);
        } else {
          activeTabInternal.value = value;
        }
      },
    });
    function changeTab(index: number) {
      activeTab.value = index;
    }

    return { activeTab, changeTab };
  },
});
</script>
