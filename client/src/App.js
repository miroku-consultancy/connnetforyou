// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Industry from './components/Industries';
import Solutions from './components/Solutions';
import Product from './components/Product';
import SubmitForm from './components/SubmitForm';
import { CartProvider } from './components/CartContext';
import Cart from './components/Cart';
import Order from './components/Order';
import Payment from './components/Payment';
import OrderSummary from './components/OrderSummary';
import EmailTokenLogin from './components/EmailTokenLogin';
import ProtectedRoute from './components/ProtectedRoute';

import { UserProvider } from './components/UserContext';
import './App.css';

const App = () => {
  return (
    <CartProvider>
      <UserProvider>
      <Router>
        <Header />

        <main>
          <Routes>
            {/* Login page directly on root path to avoid refresh 404 on Render */}
            <Route path="/" element={<EmailTokenLogin />} />

            {/* Protected Routes */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Product />
                </ProtectedRoute>
              }
            />
            <Route path="/services" element={<Services />} />
            <Route path="/industries" element={<Industry />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<SubmitForm />} />
            <Route
              path="/order"
              element={
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-summary"
              element={
                <ProtectedRoute>
                  <OrderSummary />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Cart />

        <footer>
          <p>&copy; 2024 Connect4U. All rights reserved.</p>
        </footer>
      </Router>
      </UserProvider>
    </CartProvider>
  );
};

export default App;
