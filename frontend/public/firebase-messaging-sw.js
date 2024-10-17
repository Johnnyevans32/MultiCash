// Import the firebase app / messaging packages
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js"
);

// Initialize app
firebase.initializeApp({
  apiKey: "AIzaSyDB8pN9_k7fdJXu_cMGBCV3Wm7L8ip15uE",
  authDomain: "multicash-wallet.firebaseapp.com",
  projectId: "multicash-wallet",
  storageBucket: "multicash-wallet.appspot.com",
  messagingSenderId: "104804405371",
  appId: "1:104804405371:web:ae7c340df5bfaadb3c12de",
  measurementId: "G-YLRNJYNB9L",
});

// Initialize messaging
const messaging = firebase.messaging();

// Listen to background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png",
    badge: "/whitelogo.png",
    data: {
      url: payload.data.url,
      sound: "/sound.wav",
    },
  };

  // Show notification when message received
  self.registration.showNotification(title, notificationOptions);

  const sound = new Audio(notificationOptions.data.sound);
  sound.play().catch((err) => console.log("error playin notif sound", err));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const url = notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
