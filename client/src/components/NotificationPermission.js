// src/NotificationPermission.js
import React, { useEffect } from 'react';
import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';

const NotificationPermission = () => {
  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY',
          });
          if (token) {
            console.log('FCM Token:', token);
            // Send the token to your server
          }
        } catch (error) {
          console.error('Error getting token:', error);
        }
      }
    };

    requestPermission();
  }, []);

  return <div>Requesting notification permission...</div>;
};

export default NotificationPermission;
