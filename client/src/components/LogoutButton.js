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

  const shopSlug = location.pathname.split('/')[1];
  navigate(shopSlug ? `/${shopSlug}/login` : '/login');
};


  return (
    <button className="logout-button" onClick={handleLogout} title="Logout">
      ⎋
    </button>
  );
};

export default LogoutButton;
