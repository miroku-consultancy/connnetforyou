// src/App.js
import React, { useEffect, useState } from 'react';
import {
  HashRouter as Router, Routes, Route, Navigate, useLocation
} from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import { UserProvider, useUser } from './components/UserContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import EmailTokenLogin from './components/EmailTokenLogin';
import Product from './components/Product';
import Order from './components/Order';
import Payment from './components/Payment';
import OrderSummary from './components/OrderSummary';
import OrderHistory from './components/OrderHistory';
import AddressPopup from './components/AddressPopup';
import AddProduct from './components/AddProduct';
import QrLoginPage from './components/QrLoginPage';
import ShopQRCodes from './components/ShopQRCodes';
import ShopDashboard from './components/ShopDashboard';
import ShopOrderHistory from './components/ShopOrderHistory';
import VendorDashboard from './components/VendorDashboard';
import UpdateProduct from './components/UpdateProduct';
import ConsentPage from './components/ConsentPage';
import Cart from './components/Cart';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { requestForToken, onMessageListener } from './firebase-messaging';

const extractShopSlug = (pathname) => {
  const match = pathname.match(/^\/([^/]+)/);
  return match ? match[1] : null;
};

const CartProviderWithParams = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();
  const shopSlug = extractShopSlug(location.pathname);
  return (
    <CartProvider userId={user?.id} shopSlug={shopSlug}>
      {children}
    </CartProvider>
  );
};

const AppRoutes = () => (
  <CartProviderWithParams>
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<Navigate to="/demo/login" />} />
        <Route path="/:shopSlug/login" element={<EmailTokenLogin />} />
        <Route path="/:shopSlug/products" element={<ProtectedRoute><Product /></ProtectedRoute>} />
        <Route path="/:shopSlug/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
        <Route path="/:shopSlug/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/:shopSlug/order-summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
        <Route path="/:shopSlug/order-history" element={<OrderHistory />} />
        <Route path="/:shopSlug/address" element={<AddressPopup />} />
        <Route path="/:shopSlug/admin/add-product" element={<AddProduct />} />
        <Route path="/:shopSlug/admin/dashboard" element={<ProtectedRoute><ShopDashboard /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/:shopSlug/shop-orders" element={<ProtectedRoute><ShopOrderHistory /></ProtectedRoute>} />
        <Route path="/:shopSlug/admin/edit-product/:id" element={<ProtectedRoute><UpdateProduct /></ProtectedRoute>} />
        <Route path="/qr-login" element={<QrLoginPage />} />
        <Route path="/qr-codes" element={<ShopQRCodes />} />
        <Route path="/consent" element={<ConsentPage />} />
      </Routes>
    </main>
    <Cart />
    <footer><p>&copy; 2024 Connect4U</p></footer>
  </CartProviderWithParams>
);

const App = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.error('SW registration failed:', err));
    }

    // Get permission + token once user logs in
    if (user) {
      requestForToken().then(token => {
        if (token) {
          setFcmToken(token);
          // 👉 TODO: POST token to /api/save-fcm-token
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      ToastContainer; // Optionally show UI/notification toast here
      console.log('Foreground notification:', payload);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <UserProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </UserProvider>
    </Router>
  );
};

export default App;
