<template>
  <CommonPlainModal :open="open" @change-modal-status="changeModalStatus">
    <template v-slot:image>
      <div
        :class="`card-${currentFeatureIndex}`"
        class="h-64 card flex flex-col items-center justify-center text-white text-5xl text-center font-bold"
      >
        {{ features[currentFeatureIndex].title }}
      </div>
    </template>
    <template v-slot:content>
      <div class="sm:h-56 px-4 py-6 sm:px-6">
        <span
          :class="features[currentFeatureIndex].categoryStyles"
          class="md:text-xs text-tiny py-1 px-2 rounded-xl"
        >
          {{ features[currentFeatureIndex].category }}
        </span>
        <h3 class="text-lg leading-6 font-bold underline decoration-red-600">
          {{ features[currentFeatureIndex].title }}
        </h3>
        <p class="mt-2 text-sm">
          {{ features[currentFeatureIndex].description }}
        </p>
      </div>

      <div class="px-4 py-3 sm:px-6 flex justify-between items-center">
        <div class="flex gap-1">
          <span
            v-for="(feature, index) in features"
            :key="index"
            class="h-2 w-2 rounded-full"
            :class="{
              'bg-blue-600': currentFeatureIndex === index,
              'bg-gray-600': currentFeatureIndex !== index,
            }"
          ></span>
        </div>
        <div class="flex gap-2">
          <CommonButton
            text="Previous"
            @btn-action="prevFeature"
            custom-css="bg-base"
          />
          <CommonButton
            text="Next"
            @btn-action="nextFeature"
            custom-css="!bg-blue-600 text-white"
          />
        </div>
      </div>
    </template>
  </CommonPlainModal>
</template>

<script lang="ts">
import { useConfigStore } from "~/store/config";

export default defineComponent({
  props: {
    open: {
      type: Boolean,
    },
  },
  emits: ["changeModalStatus"],
  setup(props: any, ctx: any) {
    onMounted(() => {
      setTimeout(() => {
        changeModalStatus(true);
      }, 3000);
    });

    const changeModalStatus = (value: boolean) => {
      ctx.emit("changeModalStatus", value);
    };

    const features = ref([
      {
        title: "International Funding via Stripe",
        description:
          "Now support funding in international currencies including USD, EUR, GBP, MXN, and AUD through Stripe. Effortlessly add funds from your international accounts, making your MultiCash experience even more versatile.",
        category: "Feature",
        categoryStyles: "bg-yellow-100 text-yellow-700",
      },
      {
        title: "Multi-Currency Wallet",
        description:
          "Manage multiple currencies in a single wallet with ease. Seamlessly switch between different currency accounts, allowing you to hold, send, or exchange in the currency of your choice. Keep track of your balances across currencies, all from one unified interface.",
        category: "Feature",
        categoryStyles: "bg-blue-100 text-blue-700",
      },
      {
        title: "Secure Withdrawals",
        description:
          "Withdraw funds directly to your bank or other supported platforms securely. Our robust security protocols ensure that every withdrawal is protected, while offering multiple withdrawal options, including local and international bank accounts, ensuring flexibility and reliability in all transactions.",
        category: "Security",
        categoryStyles: "bg-green-100 text-green-700",
      },
      {
        title: "Flexible Currency Exchange",
        description:
          "Effortlessly exchange currencies with offers from multiple Participating Financial Institutions (PFIs). tbDEX integration allows for fast, secure exchanges with competitive rates, ensuring you get the best value for your money. Benefit from low platform fees, making your currency exchanges cost-effective while maintaining transparency in every transaction.",
        category: "Feature",
        categoryStyles: "bg-yellow-100 text-yellow-700",
      },
      {
        title: "Push Notifications",
        description:
          "Stay up to date with real-time notifications for every transaction and exchange you initiate. From successful payments to incoming funds and exchange rate alerts, our notification system ensures that you are always in the loop without needing to check the app constantly.",
        category: "Feature",
        categoryStyles: "bg-purple-100 text-purple-700",
      },
      {
        title: "Virtual Cards",
        description:
          "Create virtual cards for secure online shopping and transactions. Use your virtual cards to make purchases while protecting your actual card details. Customize the limits and usage preferences for added security and control, making online payments safer and more convenient.",
        category: "Feature",
        categoryStyles: "bg-red-100 text-red-700",
      },
      {
        title: "24/7 Support",
        description:
          "Our dedicated support team is available around the clock to assist you with any issues or inquiries. Whether it’s a technical problem, a question about your transactions, or help with account management, we’re here to provide solutions, ensuring a smooth experience no matter the time zone.",
        category: "Support",
        categoryStyles: "bg-gray-100 text-gray-700",
      },
    ]);

    const currentFeatureIndex = ref(0);

    const nextFeature = () => {
      currentFeatureIndex.value =
        (currentFeatureIndex.value + 1) % features.value.length;
    };

    const prevFeature = () => {
      currentFeatureIndex.value =
        (currentFeatureIndex.value - 1 + features.value.length) %
        features.value.length;
    };

    return {
      features,
      currentFeatureIndex,
      nextFeature,
      prevFeature,
      changeModalStatus,
    };
  },
});
</script>

<style scoped>
.card-0 {
  background-image: url("../../assets/images/feature-0.svg");
}
.card-1 {
  background-image: url("../../assets/images/feature-1.svg");
}
.card-2 {
  background-image: url("../../assets/images/feature-2.svg");
}
.card-3 {
  background-image: url("../../assets/images/feature-3.svg");
}
.card-4 {
  background-image: url("../../assets/images/feature-4.svg");
}
.card-5 {
  background-image: url("../../assets/images/feature-5.svg");
}
.card-6 {
  background-image: url("../../assets/images/feature-6.svg");
}
</style>
