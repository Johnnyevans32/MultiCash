<template>
  <div class="border-b-[1px] border-base text-left py-5">
    <CommonPageBar mainPage="Settings" currentPage="Sessions" />
  </div>

  <div
    v-for="session in sessions"
    :key="session.id"
    class="cursor-pointer p-5 flex items-center h-16 justify-between rounded-xl bg-lightbase"
    @click="openSessionDetailsModal(session)"
  >
    <div class="flex space-x-3 items-center">
      <CommonImage :image="session.name" :alt="session.name" />

      <div class="flex flex-col text-left">
        <span class="md:text-sm text-xs">{{ session.name }}</span>
        <span class="md:text-sm text-xs line-clamp-1">{{
          session.lastActivity
        }}</span>
      </div>
    </div>
    <font-awesome-icon icon="arrow-right" />
  </div>

  <CommonModal
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
        custom-css="bg-blue-600 w-full text-white"
      />
      <CommonButton
        text="Logout the device shown"
        @btn-action="sessionDetailsModal = false"
        custom-css="bg-red-600 w-full text-white"
      />
    </template>
  </CommonModal>
</template>

<script lang="ts">
import type { UserDevice } from "~/types/user";
export default defineComponent({
  setup() {
    useSeoMeta({
      title: "Settings",
      ogTitle: "Settings",
    });

    const sessionDetailsModal = ref(false);
    const modalSession = ref<UserDevice | null>();

    const { withLoadingPromise } = useLoading();

    const sessions = ref<UserDevice[]>([]);

    onBeforeMount(async () => {
      fetchSessions();
    });

    const isFetchSessionsLoading = ref(false);
    const fetchSessions = async () => {
      await withLoadingPromise(
        $api.userService.fetchUserDevices().then((data) => {
          sessions.value = data;
        }),
        isFetchSessionsLoading
      );
    };

    const sessionDetails = computed(() => {
      if (!modalSession.value) {
        return [];
      }
      const { name } = modalSession.value;

      return [
        {
          title: "Device name",
          value: name,
        },
      ];
    });

    const openSessionDetailsModal = (session: UserDevice) => {
      modalSession.value = session;
      sessionDetailsModal.value = true;
    };

    return {
      sessionDetailsModal,
      sessionDetails,
      sessions,
      openSessionDetailsModal,
    };
  },
});
</script>
