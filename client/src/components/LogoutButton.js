import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LogoutButton.css'; // optional, for styling

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/'); // 👈 Redirects to the EmailTokenLogin component
  };

  return (
    <button className="logout-button" onClick={handleLogout} title="Logout">
      ⎋
    </button>
  );
};

export default LogoutButton;
