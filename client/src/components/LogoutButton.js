import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext'; // ✅ Import clearCart from context
import './LogoutButton.css'; // Optional styling

const LogoutButton = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart(); // ✅ Use clearCart

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    clearCart(); // ✅ Clear the cart on logout
    navigate('/'); // ✅ Redirect to login or home page
  };

  return (
    <button className="logout-button" onClick={handleLogout} title="Logout">
      ⎋
    </button>
  );
};

export default LogoutButton;
