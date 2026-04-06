importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDJnOh92AYUzFeWtuLMtDciETdpCQ7-MNs",
  authDomain: "halorebook.firebaseapp.com",
  projectId: "halorebook",
  storageBucket: "halorebook.firebasestorage.app",
  messagingSenderId: "58132767978",
  appId: "1:58132767978:web:8136b579841652b15a6393",
  measurementId: "G-TDSM97W54X"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/assets/icons/icon-192.png"
  });
});
