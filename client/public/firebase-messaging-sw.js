// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCb-DDzsODTuAID6mSBc_yNspH1NZuFdwM",
  authDomain: "connectfree4u-ef6e3.firebaseapp.com",
  projectId: "connectfree4u-ef6e3",
  storageBucket: "connectfree4u-ef6e3.firebasestorage.app",
  messagingSenderId: "781867072533",
  appId: "1:781867072533:web:eb824e70d01992e1ece21c",
  measurementId: "G-GV14CLD8WL"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notif = payload.notification || payload.data;
  const clickUrl = payload.notification?.click_action
                || payload.data?.click_action
                || '/';

  self.registration.showNotification(notif.title, {
    body: notif.body,
    icon: notif.icon || '/favicon.ico',
    tag: notif.tag || 'shop-order',
    data: { url: clickUrl }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      for (let client of windows) {
        if (client.url.includes(url)) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
