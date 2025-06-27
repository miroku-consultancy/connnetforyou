import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Header.css';
import logo from '../assets/images/logo.png';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';  // Your backend URL

const Header = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [shopInfo, setShopInfo] = useState({ name: '', address: '' });
  const { shopSlug } = useParams();

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/navigation`);
        if (!response.ok) throw new Error('Failed to fetch navigation');
        const data = await response.json();
        setNavItems(Array.isArray(data.navItems) ? data.navItems : []);
      } catch {
        setNavItems([]);
      }
    };

    fetchNavItems();
  }, []);

  useEffect(() => {
    const fetchShopInfo = async () => {
      if (!shopSlug) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/shops/${shopSlug}`);
        if (!res.ok) {
          setShopInfo({ name: 'Shop Not Found', address: '' });
          return;
        }
        const data = await res.json();
        setShopInfo({
          name: data.name || '',
          address: data.address || '',
        });
      } catch (error) {
        console.error('Error fetching shop info:', error);
        setShopInfo({ name: 'Error Loading Shop', address: '' });
      }
    };

    fetchShopInfo();
  }, [shopSlug]);

  const handleMouseEnter = (index) => setExpandedIndex(index);
  const handleMouseLeave = () => setExpandedIndex(null);

  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
        <div className="company-name">
          <span>ConnectFree4U</span>
        </div>
      </div>

      <nav className="nav">
        <ul className="nav-list">
          {navItems.map((item, index) => (
            <li
              key={item.name}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <Link to={item.id} className="dropdown-toggle" aria-label={`Toggle ${item.name} dropdown`}>
                {item.name}
              </Link>
              {expandedIndex === index && (
                <div className="dropdown-content">
                  {Array.isArray(item.description) && item.description.map((desc, i) => (
                    <div key={i} className="dropdown-item">{desc}</div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="header-right">
        {shopInfo.name && (
          <>
            <span className="shop-name">{shopInfo.name}</span>
            {shopInfo.address && <span className="shop-address">📍 {shopInfo.address}</span>}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
