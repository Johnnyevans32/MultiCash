<template>
  <TabGroup>
    <TabList class="flex rounded-xl w-full bg-lightbase p-2">
      <Tab
        v-for="tab in tabs"
        as="template"
        :key="tab.title"
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
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/vue";

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
      type: Array<{ title: string; content: any }>,
      default: [],
    },
  },
  setup() {
    return {};
  },
});
</script>
