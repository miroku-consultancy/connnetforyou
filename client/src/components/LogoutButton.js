import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove token
    navigate('/auth'); // Redirect to login page
  };

  return (
    <button onClick={handleLogout} style={{ marginLeft: '1rem', background: 'tomato', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}>
      Logout
    </button>
  );
};

export default LogoutButton;
