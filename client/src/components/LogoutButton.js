import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from './CartContext';
import './LogoutButton.css';

const LogoutButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    clearCart();

    // Extract shopSlug from URL (assumes URL like /shopSlug/...)
    const shopSlug = location.pathname.split('/')[1];

    // Redirect back to the shop page or fallback to home
    navigate(shopSlug ? `/${shopSlug}` : '/');
  };

  return (
    <button className="logout-button" onClick={handleLogout} title="Logout">
      ⎋
    </button>
  );
};

export default LogoutButton;
