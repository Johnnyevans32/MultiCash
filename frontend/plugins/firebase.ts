import { initializeApp } from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";
import { notify } from "@kyvg/vue3-notification";
import { useRouter } from "vue-router";

export default defineNuxtPlugin(() => {
  const app = initializeApp({
    apiKey: "AIzaSyDB8pN9_k7fdJXu_cMGBCV3Wm7L8ip15uE",
    authDomain: "multicash-wallet.firebaseapp.com",
    projectId: "multicash-wallet",
    storageBucket: "multicash-wallet.appspot.com",
    messagingSenderId: "104804405371",
    appId: "1:104804405371:web:ae7c340df5bfaadb3c12de",
    measurementId: "G-YLRNJYNB9L",
  });

  const messaging = getMessaging(app);
  const router = useRouter();

  onMessage(messaging, async (payload) => {
    notify({
      type: "info",
      title: payload.notification?.body,
    });

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const { title, body } = payload.notification!;
      const options = {
        body: body,
        icon: "/logo.png",
        badge: "/whitelogo.png",
        data: {
          ...(payload.data || {}),
          sound: "/sound.mp3",
        },
      };

      navigator.serviceWorker.getRegistration().then(function (reg) {
        reg?.showNotification(title as string, options);
      });

      const sound = new Audio(options.data.sound);
      sound.play().catch((err) => console.log("error playin notif sound", err));
    }

    router.replace({
      path: router.currentRoute.value.path,
      query: {
        ...router.currentRoute.value.query,
        r: new Date().getTime(),
      },
    });
  });

  return {
    provide: {
      messaging,
    },
  };
});
