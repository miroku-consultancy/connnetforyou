import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from './CartContext';
import './LogoutButton.css';

const LogoutButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    clearCart();

    const shopSlug = location.pathname.split('/')[1];
    navigate(shopSlug ? `/${shopSlug}/login` : '/login');
  };

  return (
    <button
      className="logout-button"
      onClick={handleLogout}
      title="Logout"
      aria-label="Logout"
    >
      🔓 Logout
    </button>
  );
};

export default LogoutButton;
