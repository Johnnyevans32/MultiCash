<template>
  <TabGroup>
    <TabList class="flex rounded-xl w-full bg-lightbase p-2">
      <Tab
        v-for="menu in tabMenu"
        as="template"
        :key="menu.title"
        v-slot="{ selected }"
      >
        <div
          :class="[
            'w-full rounded-xl py-1 cursor-pointer ',
            selected && 'bg-base shadow',
          ]"
        >
          {{ menu.title }}
        </div>
      </Tab>
    </TabList>
    <TabPanels class="mt-4">
      <TabPanel v-for="menu in tabMenu" :key="menu.title">
        <component :is="menu.content" />
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
    tabMenu: {
      type: Array<{ title: string; content: any }>,
      default: [],
    },
  },
  setup() {
    return {};
  },
});
</script>
