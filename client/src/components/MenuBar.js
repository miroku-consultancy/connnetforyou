// components/MenuBar.js
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from './UserContext';
import LogoutButton from './LogoutButton';

const MenuBar = () => {
  const { user } = useUser();
  const location = useLocation();
  const shopSlug = location.pathname.split('/')[1] || '';
  const [navItems, setNavItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    fetch('https://connnet4you-server.onrender.com/api/navigation')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setNavItems(data.navItems || []))
      .catch(err => console.error('Navigation fetch error:', err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsVendor(decoded.role === 'vendor');
      } catch (err) {
        console.error('Invalid token:', err);
        setIsVendor(false);
      }
    }
  }, []);

  return (
    <ul className="nav-list">
      {navItems.map((itm, idx) => (
        <li
          key={idx}
          onMouseEnter={() => setExpandedIndex(idx)}
          onMouseLeave={() => setExpandedIndex(null)}
        >
          <Link to={`/${shopSlug}${itm.id}`} className="dropdown-toggle">
            {itm.name}
          </Link>
          {expandedIndex === idx && itm.description?.length > 0 && (
            <div className="dropdown-content">
              {itm.description.map((d, i2) => (
                <div key={i2} className="dropdown-item">{d}</div>
              ))}
            </div>
          )}
        </li>
      ))}

      {user && (
        <>
          <li>
            <Link to={`/${shopSlug}/order-history`} className="dropdown-toggle">
              📜 Order History
            </Link>
          </li>
          {isVendor && (
            <>
              <li>
                <Link to="/vendor/dashboard" className="dropdown-toggle">
                  📊 Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link to={`/${shopSlug}/shop-orders`} className="dropdown-toggle">
                  🛍️ Shop Orders
                </Link>
              </li>
              <li>
                <Link to={`/${shopSlug}/admin/add-product`} className="dropdown-toggle">
                  ➕ Add Product
                </Link>
              </li>
            </>
          )}
          <li>
            <LogoutButton />
          </li>
        </>
      )}
    </ul>
  );
};

export default MenuBar;
