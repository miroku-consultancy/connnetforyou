import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken');
        setUser(null);
        setLoadingUser(false);
        return;
      }

      const res = await fetch('https://connnet4you-server.onrender.com/api/users/me', {
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
        profileImage: userData.profile_image, // ✅ normalize field
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

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
