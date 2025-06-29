// VendorDashboard.js
import React from 'react';
import { useUser } from './UserContext';
import ShopNotifications from './ShopNotifications';

const VendorDashboard = () => {
  const { user, loadingUser } = useUser();

  if (loadingUser) return <p>Loading user info...</p>;
  if (!user || user.role !== 'vendor') return <p>⛔ Access denied. Only vendors can view this page.</p>;

  return (
    <div>
      <h1>👋 Welcome, {user.email}</h1>
      <ShopNotifications />
    </div>
  );
};

export default VendorDashboard;
