// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCb-DDzsODTuAID6mSBc_yNspH1NZuFdwM",
  authDomain: "connectfree4u-ef6e3.firebaseapp.com",
  projectId: "connectfree4u-ef6e3",
  storageBucket: "connectfree4u-ef6e3.firebasestorage.app",
  messagingSenderId: "781867072533",
  appId: "1:781867072533:web:eb824e70d01992e1ece21c",
  measurementId: "G-GV14CLD8WL"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
