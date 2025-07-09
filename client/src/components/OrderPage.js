// OrderPage.js

import React from 'react';
import { useUser } from './UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import EmailTokenLogin from './EmailTokenLogin';

const OrderPage = () => {
  const { user, loadingUser } = useUser();
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  if (loadingUser) {
    return <div>Loading user info...</div>;
  }

  if (!user) {
    // Not logged in - show login form
    return (
      <div>
        <h2>Please Login to Place Your Order</h2>
        <EmailTokenLogin />
      </div>
    );
  }

  // Logged in - show order page content (customize this)
  return (
    <div>
      <h1>Place Your Order for {shopSlug}</h1>
      <p>Order UI goes here — show cart summary, address, payment, etc.</p>
      {/* You can import and use your existing order components here */}
    </div>
  );
};

export default OrderPage;
