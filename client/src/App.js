import React, { useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import { UserProvider, useUser } from './components/UserContext';

import EmailTokenLogin from './components/EmailTokenLogin';
import Order from './components/Order';
import Payment from './components/Payment';
import OrderSummary from './components/OrderSummary';
import OrderHistory from './components/OrderHistory';
import Product from './components/Product';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import Header from './components/Header';
import AddressPopup from './components/AddressPopup';
import AddProduct from './components/AddProduct';
import QrLoginPage from './components/QrLoginPage';
import ShopQRCodes from './components/ShopQRCodes';
import ShopDashboard from './components/ShopDashboard';
import ShopOrderHistory from './components/ShopOrderHistory';
import VendorDashboard from './components/VendorDashboard';
import UpdateProduct from './components/UpdateProduct';
import ConsentPage from './components/ConsentPage';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { requestForToken, onMessageListener } from '../public/firebase-messaging-sw';
import { register } from './components/serviceWorker';

// Extract shopSlug manually from the pathname
const extractShopSlug = (pathname) => {
  const match = pathname.match(/^\/([^/]+)/);
  return match ? match[1] : null;
};

// Use location + user context to scope cart
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
        <Route path="/" element={<Navigate to="/demo/login" replace />} />
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

    <footer>
      <p>&copy; 2024 Connect4U. All rights reserved.</p>
    </footer>
  </CartProviderWithParams>
);

const App = () => {
  useEffect(() => {
    // Register service worker for background notifications
    register();

    // Request notification permission and get FCM token
    const getToken = async () => {
      const token = await requestForToken();
      if (token) {
        // TODO: send this token to your backend to register for push notifications
        console.log('FCM Token:', token);
      }
    };
    getToken();

    // Listen for foreground messages and show toast notifications
    const unsubscribe = onMessageListener((payload) => {
      const title = payload.notification?.title || 'Notification';
      const body = payload.notification?.body || '';
      toast.info(`${title}: ${body}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <UserProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </UserProvider>
    </Router>
  );
};

export default App;
