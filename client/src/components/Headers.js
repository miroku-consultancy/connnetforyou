import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const Header = () => {
  const isLoggedIn = !!localStorage.getItem('authToken');

  return (
    <header className="header">
      <nav>
        <Link to="/products">Products</Link>
        <Link to="/services">Services</Link>
        <Link to="/order">Order</Link>
        <Link to="/contact">Contact</Link>
        {isLoggedIn && <LogoutButton />}
      </nav>
    </header>
  );
};

export default Header;
