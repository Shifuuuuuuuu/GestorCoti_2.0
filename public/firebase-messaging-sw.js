/* eslint-disable no-undef */
// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDEv3scnjXxzWEZRBjY38SRgi5gCwCAyp0",
  authDomain: "xtremesolped.firebaseapp.com",
  projectId: "xtremesolped",
  storageBucket: "xtremesolped.appspot.com",
  messagingSenderId: "731445433885",
  appId: "1:731445433885:web:dcf44a5f24dce64d3518f4",
});
const messaging = firebase.messaging();
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Notificación";
  const options = {
    body: payload?.notification?.body || "",
    icon: payload?.notification?.icon || "/favicon.ico",
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});
