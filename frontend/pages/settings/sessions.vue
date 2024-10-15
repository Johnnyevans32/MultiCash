<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Sessions" />
  </div>

  <div v-if="isFetchSessionsLoading">
    <div
      v-for="i in 3"
      :key="i"
      class="p-5 cursor-progress flex mb-2 items-center h-16 justify-between rounded-xl text-base bg-lightbase border-[1px] border-base animate-pulse"
    >
      <div class="flex space-x-2 items-center">
        <div class="bg-base h-7 w-7 rounded-lg"></div>

        <div class="flex flex-col gap-2">
          <div class="h-2 w-20 bg-base rounded"></div>
          <div class="h-2 w-28 bg-base rounded"></div>
        </div>
      </div>
      <div class="h-2 w-12 bg-base rounded"></div>
    </div>
  </div>
  <div v-else class="flex flex-col gap-2">
    <div
      v-for="session in sessions"
      :key="session.id"
      class="cursor-pointer p-5 flex items-center h-16 justify-between rounded-xl bg-lightbase"
      @click="openSessionDetailsModal(session)"
    >
      <div class="flex space-x-3 items-center">
        <font-awesome-icon :icon="getDeviceInfo(session.deviceName).icon" />

        <div class="flex flex-col text-left">
          <span class="md:text-sm text-xs"
            >{{ getDeviceInfo(session.deviceName).name }}
          </span>
          <span
            v-if="session.sessionClientId === sessionClientId"
            class="md:text-xs text-tiny py-1 px-2 rounded-lg text-white bg-blue-700"
          >
            Active Session
          </span>
          <span v-else class="md:text-sm text-xs">{{
            formatDate(session.lastActivity, "ddd, MMM Do YYYY, h:mm:ss a")
          }}</span>
        </div>
      </div>
      <font-awesome-icon icon="arrow-right" />
    </div>
  </div>

  <CommonModal
    v-if="modalSession"
    :open="sessionDetailsModal"
    title="Session Details"
    @change-modal-status="
      (newVal) => {
        sessionDetailsModal = newVal;
      }
    "
  >
    <template v-slot:content>
      <div class="flex flex-col gap-2">
        <div
          v-for="(detail, index) in sessionDetails"
          :key="index"
          class="flex flex-col items-start"
        >
          <span>{{ detail.title }}:</span>
          <span class="font-bold">
            {{ detail.value }}
          </span>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <CommonButton
        text="Close"
        @btn-action="sessionDetailsModal = false"
        custom-css="bg-base w-full text-base"
      />
      <CommonButton
        v-if="modalSession.sessionClientId !== sessionClientId"
        text="Logout the session shown"
        @btn-action="logoutSession(modalSession.sessionClientId)"
        custom-css="bg-red-600 w-full text-white"
        :loading="isLogoutSessionLoading"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import type { IUserSession } from "~/types/user";
import { useUserStore } from "~/store/user";

export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });

    const { sessionClientId } = storeToRefs(useUserStore());
    const sessionDetailsModal = ref(false);
    const modalSession = ref<IUserSession | null>();

    const { withLoadingPromise } = useLoading();

    const sessions = ref<IUserSession[]>([]);

    onBeforeMount(async () => {
      fetchSessions();
    });

    const getDeviceInfo = (userAgent: string) => {
      if (/Macintosh/.test(userAgent)) {
        return { name: "Macbook", icon: "laptop" };
      } else if (/Windows/.test(userAgent)) {
        return { name: "Windows", icon: "laptop" };
      } else if (/iPhone/.test(userAgent)) {
        return { name: "iPhone", icon: "mobile" };
      } else if (/iPad/.test(userAgent)) {
        return { name: "iPad", icon: "tablet" };
      } else if (/Android/.test(userAgent)) {
        return { name: "Android", icon: "mobile" };
      } else if (/Linux/.test(userAgent)) {
        return { name: "Linux", icon: "laptop" };
      } else {
        return { name: "Unknown Device", icon: "question" };
      }
    };

    const { $api } = useNuxtApp();
    const isFetchSessionsLoading = ref(false);
    const fetchSessions = async () => {
      await withLoadingPromise(
        $api.userService.fetchUserSessions().then((data) => {
          sessions.value = data;
        }),
        isFetchSessionsLoading
      );
    };

    const sessionDetails = computed(() => {
      if (!modalSession.value) {
        return [];
      }
      const { deviceName, lastActivity, deviceIP, sessionClientId } =
        modalSession.value;

      return [
        {
          title: "Session Client Id",
          value: sessionClientId,
        },
        {
          title: "Device name",
          value: getDeviceInfo(deviceName).name,
        },
        {
          title: "Device IP",
          value: deviceIP || "no data",
        },
        {
          title: "Last activity",
          value: formatDate(lastActivity, "ddd, MMM Do YYYY, h:mm:ss a"),
        },
      ];
    });

    const openSessionDetailsModal = (session: IUserSession) => {
      modalSession.value = session;
      sessionDetailsModal.value = true;
    };

    const isLogoutSessionLoading = ref(false);
    const logoutSession = async (modalSessionClientId: string) => {
      await withLoadingPromise(
        $api.userService.logoutSession(modalSessionClientId).then(() => {
          modalSession.value = null;
          sessionDetailsModal.value = false;
          fetchSessions();
        }),
        isLogoutSessionLoading
      );
    };

    return {
      sessionDetailsModal,
      sessionDetails,
      sessions,
      openSessionDetailsModal,
      getDeviceInfo,
      logoutSession,
      modalSession,
      isLogoutSessionLoading,
      sessionClientId,
      isFetchSessionsLoading,
    };
  },
});
</script>
