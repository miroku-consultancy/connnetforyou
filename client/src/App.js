// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AddressPopup from './components/AddressPopup'; // Adjust the path if it's in a subfolder like ./pages/AddressPopup
import { ToastContainer } from 'react-toastify';
import AddProduct from './components/AddProduct'; // Adjust path as needed

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => (
  <CartProvider>
    <UserProvider>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<EmailTokenLogin />} />
            <Route path="/summary" element={<Navigate to="/order-summary" replace />} />
            <Route path="/products" element={<ProtectedRoute><Product /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/order-summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/address" element={<AddressPopup />} />
            <Route path="/admin/add-product" element={<AddProduct />} />

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
