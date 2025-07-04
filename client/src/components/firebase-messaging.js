import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCb-DDzsODTuAID6mSBc_yNspH1NZuFdwM",
  authDomain: "connectfree4u-ef6e3.firebaseapp.com",
  projectId: "connectfree4u-ef6e3",
  storageBucket: "connectfree4u-ef6e3.firebasestorage.app",
  messagingSenderId: "781867072533",
  appId: "1:781867072533:web:eb824e70d01992e1ece21c",
  measurementId: "G-GV14CLD8WL"
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

// 👉 Replace this with your actual VAPID key from Web Push certificates
const vapidKey = "BKIRqxZ6iGpVF4ebENAPnVIWbKRMxOGCtFEzmxD18G26Vg_3Jm_JL4reQ0X6eIxBs5I2ZIlV37M-Z1ZJ4hze5Ls";

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('✅ FCM token:', currentToken);
      // 👉 Send this token to your backend to save it for the current user/shop
    } else {
      console.warn('❌ No registration token available.');
    }
  } catch (err) {
    console.error('🔥 Error retrieving token:', err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground FCM message:', payload);
      resolve(payload);
    });
  });
