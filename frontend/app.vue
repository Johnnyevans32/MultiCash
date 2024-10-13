<template>
  <div :class="appThemeColor" class="bg-bgbase text-base">
    <NuxtLayout>
      <NuxtPwaManifest />
      <NuxtPage />
    </NuxtLayout>

    <notifications
      position="top center"
      width="100%"
      class="mb-2 transition-all duration-700 ease-in-out"
      animation-type="css"
      animation-name="toast"
      :pause-on-hover="true"
      :max="2"
    >
      <template #body="props">
        <div
          :class="[
            'flex items-center justify-between p-4 max-w-md md:mx-auto m-2 font-semibold rounded-xl shadow-lg',
            isDarkThemed ? 'bg-white text-black' : 'bg-[#1c1c1c] text-white',
          ]"
        >
          <div class="flex flex-col items-start">
            <span class="text-sm font-medium">{{ props.item.title }}</span>
            <span
              class="text-xs"
              v-if="props.item.text"
              :class="isDarkThemed ? 'text-gray-500' : 'text-gray-400'"
            >
              {{ props.item.text }}
            </span>
          </div>
          <div class="flex items-center ml-auto space-x-3">
            <div
              v-if="props.item.data.actions && props.item.data.actions.length"
              class="flex space-x-2"
            >
              <button
                v-for="(action, index) in props.item.data.actions"
                :key="index"
                @click="
                  async () => {
                    await action.onClick();
                    props.close();
                  }
                "
                :class="[
                  'px-3 py-1 rounded-xl border',
                  isDarkThemed
                    ? ' text-black hover:bg-gray-300  border-black'
                    : ' text-white hover:bg-gray-800  border-white',
                ]"
              >
                {{ action.label }}
              </button>
            </div>

            <button
              type="button"
              @click="props.close"
              :class="
                isDarkThemed
                  ? 'text-black hover:text-gray-600'
                  : 'text-gray-400 hover:text-white'
              "
              class="w-8 h-8 flex items-center justify-center"
            >
              <font-awesome-icon icon="xmark" class="text-xl" />
            </button>
          </div>
        </div>
      </template>
    </notifications>
  </div>
</template>

<script lang="ts">
import { useConfigStore } from "~/store/config";
import { notify } from "@kyvg/vue3-notification";

export default defineComponent({
  async setup() {
    const config = useRuntimeConfig();
    const { appThemeColor } = storeToRefs(useConfigStore());
    const { $pwa } = useNuxtApp();

    watch(
      () => $pwa?.showInstallPrompt,
      (value) => {
        if (value) {
          notify({
            title: `Install ${config.public.appName}`,
            text: "Install the app for a better experience!",
            duration: -1,
            data: {
              actions: [
                {
                  label: "Install",
                  onClick: async () => {
                    await $pwa.install();
                  },
                },
              ],
            },
          });
        }
      },
      { immediate: true }
    );

    const isDarkThemed = computed(() =>
      ["dark", "midnight"].includes(appThemeColor.value)
    );
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
      isDarkThemed,
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

.vue-notification-wrapper {
  /* Properly render shadows */
  overflow: visible !important;
}

.toast-enter-from {
  @apply translate-y-full opacity-0;
}

.toast-enter-to {
  @apply translate-y-0 opacity-100;
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  @apply transition duration-700 ease-in-out;
}

.toast-leave-from {
  @apply translate-y-0 opacity-100;
}

.toast-leave-to {
  @apply -translate-y-full opacity-0;
}
</style>
