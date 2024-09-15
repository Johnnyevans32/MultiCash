import { initializeApp } from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";
import { notify } from "@kyvg/vue3-notification";

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

  onMessage(messaging, (payload) => {
    notify({
      type: "success",
      title: payload.notification?.body,
    });
  });

  return {
    provide: {
      messaging,
    },
  };
});
