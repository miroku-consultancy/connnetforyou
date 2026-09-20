// components/MenuBar.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext';
import LogoutButton from './LogoutButton';
import { useTenant } from '../context/TenantContext';
import './MenuBar.css';

const MenuBar = ({ closeMenu }) => {
  const { user } = useUser();
  const { tenant } = useTenant();

  const shop = tenant?.shop;
  const [navItems, setNavItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    fetch('https://connnet4you-server.onrender.com/api/navigation')
      .then(res => res.ok ? res.json() : Promise.reject())
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

  const handleLinkClick = () => {
    setExpandedIndex(null);
    if (closeMenu) closeMenu();
  };

  return (
    <ul className="nav-list">
      {/* ✅ User Profile Dropdown */}
      {user && (
        <li
          className="nav-item"
          onMouseEnter={() => setExpandedIndex('user')}
          onMouseLeave={() => setExpandedIndex(null)}
        >
          <div className="nav-link" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img
              src={
                user.profileImage
                  ? `https://connnet4you-server.onrender.com${user.profileImage}`
                  : '/default-avatar.png'
              }
              alt="Avatar"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                marginRight: '8px',
                objectFit: 'cover',
              }}
            />
            {user.name?.split(' ')[0] || 'User'} ▾
          </div>
          {expandedIndex === 'user' && (
            <div className="dropdown">
              <Link to="/profile" className="dropdown-item" onClick={handleLinkClick}>📝 Edit Profile</Link>
              <Link to={`/order-history`} className="dropdown-item" onClick={handleLinkClick}>📜 Order History</Link>
              <LogoutButton onClick={handleLinkClick} />
            </div>
          )}
        </li>
      )}

      {/* ✅ Main Navigation Items from API */}
      {navItems.map((itm, idx) => (
        <li key={idx} className="nav-item">
          <div
            className="nav-link-wrapper"
            onMouseEnter={() => setExpandedIndex(idx)}
            onMouseLeave={() => setExpandedIndex(null)}
          >
            <Link to={itm.id} className="nav-link" onClick={handleLinkClick}>
              {itm.name}
            </Link>
            {expandedIndex === idx && itm.description?.length > 0 && (
              <div className="dropdown">
                {itm.description.map((d, i2) => (
                  <div key={i2} className="dropdown-item">{d}</div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}

      {/* ℹ️ Info Dropdown */}
      <li className="nav-item">
        <div
          className="nav-link-wrapper"
          onMouseEnter={() => setExpandedIndex('info')}
          onMouseLeave={() => setExpandedIndex(null)}
        >
          <span className="nav-link">ℹ️ Info ▾</span>
          {expandedIndex === 'info' && (
            <div className="dropdown">
              <Link to="/about" className="dropdown-item" onClick={handleLinkClick}>About Us</Link>
              <Link to="/help" className="dropdown-item" onClick={handleLinkClick}>Help</Link>
            </div>
          )}
        </div>
      </li>

      {/* 🛡️ Legal Dropdown */}
      <li className="nav-item">
        <div
          className="nav-link-wrapper"
          onMouseEnter={() => setExpandedIndex('legal')}
          onMouseLeave={() => setExpandedIndex(null)}
        >
          <span className="nav-link">🛡️ Legal ▾</span>
          {expandedIndex === 'legal' && (
            <div className="dropdown">
              <Link to="/privacy-policy" className="dropdown-item" onClick={handleLinkClick}>Privacy Policy</Link>
              <Link to="/terms-of-service" className="dropdown-item" onClick={handleLinkClick}>Terms of Service</Link>
            </div>
          )}
        </div>
      </li>

      {/* 🛠️ Vendor Tools */}
      {user && isVendor && (
        <li className="nav-item">
          <div
            className="nav-link-wrapper"
            onMouseEnter={() => setExpandedIndex('vendor')}
            onMouseLeave={() => setExpandedIndex(null)}
          >
            <span className="nav-link">🛠️ Store Admin Tools ▾</span>
            {expandedIndex === 'vendor' && (
              <div className="dropdown">
                <Link to="/vendor/dashboard" className="dropdown-item" onClick={handleLinkClick}>📊 Dashboard</Link>
                <Link to={`/shop-orders`} className="dropdown-item" onClick={handleLinkClick}>🛍️ Shop Orders</Link>
                <Link to={`/admin/add-product`} className="dropdown-item" onClick={handleLinkClick}>➕ Add Product</Link>
                <Link to={`/admin/add-stock`} className="dropdown-item" onClick={handleLinkClick}>➕ Add Stock</Link>
              </div>
            )}
          </div>
        </li>
      )}
    </ul>
  );
};

export default MenuBar;
