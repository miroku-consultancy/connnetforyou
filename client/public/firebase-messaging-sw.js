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
  console.log('[SW] Received background message:', payload);
  const { title, body, icon } = payload.notification || payload.data;
  self.registration.showNotification(title || 'Notification', {
    body: body || '',
    icon: icon || '/favicon.ico',
    tag: 'shop-order',
  });
});
