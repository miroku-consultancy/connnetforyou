import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { refreshAccessToken } from './authHelpers';
import { requestForToken } from './firebase-messaging'; // ✅ Import this

const API_BASE = 'https://connnet4you-server.onrender.com';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    let token = localStorage.getItem('authToken');

    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        const newToken = await refreshAccessToken(); // 🔁 Try refreshing
        if (!newToken) {
          setUser(null);
          setLoadingUser(false);
          return;
        }
        token = newToken; // ✅ use new token
      }


      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await res.json();

      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        profileImage: userData.profile_image,
      });
    } catch (err) {
      console.error('❌ Error loading user:', err);
      setUser(null);
    }

    setLoadingUser(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ✅ Save FCM token when user logs in
  useEffect(() => {
    const saveFCMToken = async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !user?.id) return;

      try {
        const token = await requestForToken();
        if (token) {
          const res = await fetch(`${API_BASE}/api/users/fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ fcm_token: token }),
          });

          if (res.ok) {
            console.log(`✅ [UserContext] FCM token saved for user ${user.id}`);
          } else {
            const errData = await res.json();
            console.warn(`⚠️ [UserContext] Failed to save FCM token:`, errData);
          }
        }
      } catch (err) {
        console.error('❌ [UserContext] Error saving FCM token:', err);
      }
    };

    saveFCMToken();
  }, [user?.id]); // 🔁 Only triggers once user is loaded

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
