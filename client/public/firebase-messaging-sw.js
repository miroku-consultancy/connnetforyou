// public/firebase-messaging-sw.js
import { onBackgroundMessage } from 'firebase/messaging/sw';
import { messaging } from './src/firebase';

onBackgroundMessage(messaging, (payload) => {
  console.log('Received background message:', payload);
  // Customize notification here
});
