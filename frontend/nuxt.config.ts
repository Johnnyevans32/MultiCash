// nuxt.config.ts
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: process.env.APP_NAME,
      title: process.env.APP_NAME,
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          hid: "description",
          name: "description",
          content: process.env.APP_DESCRIPTION,
        },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      background_color: "#F4F4F4",
      name: process.env.APP_NAME,
      description: process.env.APP_DESCRIPTION,
      short_name: process.env.APP_NAME,
      theme_color: "#F4F4F4",
      display: "standalone",
      icons: [
        {
          src: "logo.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
  },
  typescript: {
    shim: false,
    strict: true,
  },

  css: [
    "~/assets/css/styles.css",
    "@fortawesome/fontawesome-svg-core/styles.css",
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  telemetry: false,
  ssr: false,
  modules: [
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    "@vite-pwa/nuxt",
  ],

  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },

  build: {
    transpile: ["@headlessui/vue", "@fortawesome/vue-fontawesome"],
  },

  runtimeConfig: {
    public: {
      appName: process.env.APP_NAME,
      description: process.env.APP_DESCRIPTION,
      email: process.env.APP_EMAIL,
      apiUrl: process.env.API_URL,
      paystackPK: process.env.PAYSTACK_PK,
    },
  },

  compatibilityDate: "2024-09-01",
});
