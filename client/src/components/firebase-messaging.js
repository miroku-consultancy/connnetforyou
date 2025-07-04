// src/firebase-messaging.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyCb-DDzsODTuAID6mSBc_yNspH1NZuFdwM',
  authDomain: 'connectfree4u-ef6e3.firebaseapp.com',
  projectId: 'connectfree4u-ef6e3',
  storageBucket: 'connectfree4u-ef6e3.firebasestorage.app',
  messagingSenderId: '781867072533',
  appId: '1:781867072533:web:eb824e70d992e1ece21c',
  measurementId: 'G-GV14CLD8WL'
};

// Initialize Firebase & Messaging
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

// Public VAPID key from Firebase Cloud Messaging > Web configuration
const VAPID_KEY = 'BKIRqxZ6iGpVF4ebENAPnVIWbKRMxOGCtFEzmxD18G26Vg_3Jm_JL4reQ0X6eIxBs5I2ZIlV37M-Z1ZJ4hze5Ls';

/**
 * Request permission and fetch FCM registration token.
 */
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission not granted');

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('✅ FCM token:', token);
    return token;
  } catch (err) {
    console.error('🔥 Error retrieving token:', err);
    return null;
  }
};

/**
 * Listen for foreground messages.
 */
export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('📩 Foreground FCM message:', payload);
    callback(payload);
  });
};
