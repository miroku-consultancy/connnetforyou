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
import DashboardSummary from './components/DashboardSummary';
import OrderPage from './components/OrderPage';
import About from './components/About';
import HelpPage from './components/HelpPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import TermsOfServicePage from './components/TermsOfServicePage';
import UserProfileForm from './components/UserProfileForm';
import AddStock from './components/AddStock';
import ChatHub from "./components/chatHub";
//import Banner from './components/Banner';



import {
  requestForToken,
  onMessageListener
} from './components/firebase-messaging';
import { register as registerServiceWorker } from './components/serviceWorker';

const extractShopSlug = (pathname) => {
  const match = pathname.match(/^\/([^/]+)/);
  return match ? match[1] : null;
};
const API_BASE = 'https://connnet4you-server.onrender.com';

const CartProviderWithParams = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();
  const shopSlug = extractShopSlug(location.pathname);
   if (user === undefined) return null;

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
        <Route path="/" element={<Navigate to="/ConnectFREE4U/dashboard" replace />} />
        <Route path="/ConnectFREE4U/dashboard" element={<DashboardSummary />} />
        
        <Route path="/:shopSlug/login" element={<EmailTokenLogin />} />
        {/* <Route path="/:shopSlug/products" element={<ProtectedRoute><Product /></ProtectedRoute>} /> */}
        <Route path="/:shopSlug/products" element={<Product />} />
        {/* <Route path="/:shopSlug/order" element={<ProtectedRoute><Order /></ProtectedRoute>} /> */}
        <Route path="/:shopSlug/order" element={<Order />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/profile" element={<ProtectedRoute><UserProfileForm /></ProtectedRoute>} />
        <Route path="/:shopSlug/profile" element={<UserProfileForm />} />
        <Route path="/:shopSlug/admin/add-stock" element={<AddStock />} />
        <Route
  path="/chat/:chatUserId"
  element={
    <ProtectedRoute>
      <ChatHub />
    </ProtectedRoute>
  }
/>
<Route
  path="/vendor/inbox"
  element={
    <ProtectedRoute>
      <VendorInbox />
    </ProtectedRoute>
  }
/>


        {/* <Route
    path="/chat/:recipientId/:recipientName"
    element={
      <ProtectedRoute>
        <ChatHub />
      </ProtectedRoute>
    }
  />       */}
        {/* <Route path="/banner" element={<Banner />} /> */}


        {/* <Route path="/:shopSlug/order" element={<OrderPage />} /> */}
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
    console.log('App init');
    registerServiceWorker();

    (async () => {
      const token = await requestForToken();
      console.log('👉 requestForToken returned token:', token);
      if (token) {
        const res = await fetch(`${API_BASE}/api/save-fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ fcm_token: token }),
        });
        const data = await res.json();
        console.log('🔁 save-fcm-token response:', res.status, data);
      }
    })();

    const unsub = onMessageListener(payload => {
      console.log('📩 foreground payload:', payload);
      const notif = payload.notification || payload.data;
      toast.info(`${notif.title}: ${notif.body}`, { position: 'top-right' });
    });

    return () => unsub();
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
