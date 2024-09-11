<template>
  <div :class="appThemeColor" class="bg-bgbase text-base">
    <NuxtLayout>
      <NuxtPwaManifest />
      <NuxtPage />
    </NuxtLayout>

    <NuxtPwaManifest />
    <notifications position="top center" width="100%" animation-type="css">
      <template #body="props">
        <div
          :class="[
            'flex items-center p-5 md:mx-[30vw] font-semibold bg-black border-l-4 text-white',
            {
              'border-green-500': props.item.type === 'success',
              'border-blue-500': props.item.type === 'info',
              'border-red-500':
                props.item.type !== 'success' && props.item.type !== 'info',
            },
          ]"
        >
          <font-awesome-icon
            v-if="props.item.type === 'success'"
            icon="fa-solid fa-thumbs-up"
            class="text-green-500"
          />
          <font-awesome-icon
            v-else-if="props.item.type === 'info'"
            icon="fa-solid fa-circle-exclamation"
            class="text-blue-500"
          />
          <font-awesome-icon
            v-else
            icon="fa-solid fa-circle-exclamation"
            class="text-red-500"
          />
          <div class="ml-3 text-sm font-medium">
            <div>{{ props.item.title }}</div>
            <div
              v-if="props.item.text"
              class="text-xs"
              v-html="props.item.text"
            />
          </div>
          <button
            type="button"
            @click="props.close"
            class="ml-auto -mx-1.5 -my-1.5 text-white w-6 h-6 p-2 rounded-xl flex items-center justify-center"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
      </template>
    </notifications>
  </div>
</template>

<script lang="ts">
import { useConfigStore } from "~/store/config";

export default defineComponent({
  async setup() {
    const config = useRuntimeConfig();
    const { appThemeColor } = storeToRefs(useConfigStore());

    const browserThemeMap: any = {
      light: "244, 244, 244",
      cherry: "255, 255, 255",
      coffee: "255, 255, 255",
      dark: "0, 0, 0",
      white: "255, 255, 255",
      ocean: "255, 255, 255",
      forest: "255, 255, 255",
      midnight: "0, 0, 0",
      sunflower: "255, 255, 255",
      "ocean-breeze": "255, 255, 255",
      "royal-purple": "255, 255, 255",
      "lavender-dream": "255, 255, 255",
      lemon: "255, 255, 255",
    };
    useHead({
      titleTemplate: (titleChunk: any) => {
        return titleChunk && titleChunk !== config.public.appName
          ? `${config.public.appName}: ${titleChunk}`
          : config.public.appName;
      },
    });

    watch(appThemeColor, () => {
      setBrowserThemeColor();
    });

    onBeforeMount(async () => {
      setBrowserThemeColor();
    });

    const setBrowserThemeColor = () => {
      let themeColorDOM = document.querySelector('meta[name="theme-color"]');

      if (!themeColorDOM) {
        themeColorDOM = document.createElement("meta");
        themeColorDOM.setAttribute("name", "theme-color");
        document.head.appendChild(themeColorDOM);
      }

      themeColorDOM.setAttribute(
        "content",
        `rgb(${browserThemeMap[appThemeColor.value]})`
      );
    };

    return {
      appThemeColor,
    };
  },
});
</script>

<style>
html {
  font-family: "PowerGroteskTrial-Regular";
}

@font-face {
  font-family: "PowerGroteskTrial-Bold";
  src: local("PowerGroteskTrial"),
    url("./assets/PowerGroteskTrial-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "PowerGroteskTrial-Light";
  src: local("PowerGroteskTrial"),
    url("./assets/PowerGroteskTrial-Light.ttf") format("truetype");
}
@font-face {
  font-family: "PowerGroteskTrial-Regular";
  src: local("PowerGroteskTrial"),
    url("./assets/PowerGroteskTrial-Regular.ttf") format("truetype");
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}
</style>
