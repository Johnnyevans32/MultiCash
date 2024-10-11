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
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/logo.svg", sizes: "any", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png" },
      ],
    },
  },
  pwa: {
    client: {
      installPrompt: true,
    },
    registerType: "autoUpdate",
    devOptions: {
      enabled: process.env.ENV_MODE === "dev",
    },
    manifest: {
      name: process.env.APP_NAME,
      short_name: process.env.APP_NAME,
      description: process.env.APP_DESCRIPTION,
      theme_color: "#F4F4F4",
      background_color: "#F4F4F4",
      display: "standalone",
      start_url: "/",
      icons: [
        {
          src: "pwa-64x64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      screenshots: [
        {
          src: "screenshot-desktop.png",
          sizes: "1280x640",
          type: "image/png",
          form_factor: "wide",
        },
        {
          src: "screenshot-mobile.png",
          sizes: "591x1279",
          type: "image/png",
          form_factor: "narrow",
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
      paystackPublickKey: process.env.PAYSTACK_PUBLIC_KEY,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    },
  },

  compatibilityDate: "2024-09-01",
});
