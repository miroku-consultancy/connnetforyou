import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user from token in localStorage and validate expiry
  const refreshUser = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token); // { id, email, iat, exp }
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          // Token expired
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Invalid token', err);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } else {
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
