import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import { UserProvider } from './components/UserContext';
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
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => (
  <CartProvider>
    <UserProvider>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/SanjayVegStore/login" replace />} />
            <Route path="/:shopSlug/login" element={<EmailTokenLogin />} />
            <Route path="/:shopSlug/products" element={<ProtectedRoute><Product /></ProtectedRoute>} />
            <Route path="/:shopSlug/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
            <Route path="/:shopSlug/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/:shopSlug/order-summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
            <Route path="/:shopSlug/order-history" element={<OrderHistory />} />
            <Route path="/:shopSlug/address" element={<AddressPopup />} />
            <Route path="/:shopSlug/admin/add-product" element={<AddProduct />} />
          </Routes>
        </main>
        <Cart />
        <footer><p>&copy; 2024 Connect4U. All rights reserved.</p></footer>

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
      </Router>
    </UserProvider>
  </CartProvider>
);

export default App;
