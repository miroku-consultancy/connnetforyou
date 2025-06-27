import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import logo from '../assets/images/logo.png';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Header = () => {
  const location = useLocation();
  const shopSlug = location.pathname.split('/')[1] || null;

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/navigation`);
        if (!response.ok) throw new Error('Failed to fetch navigation');
        const data = await response.json();
        setNavItems(Array.isArray(data.navItems) ? data.navItems : []);
      } catch (error) {
        setNavItems([]);
        console.error('Error fetching nav items:', error);
      }
    };
    fetchNavItems();
  }, []);

  useEffect(() => {
    if (!shopSlug) return setShop(null);
    const fetchShop = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shops/${shopSlug}`);
        if (!res.ok) {
          const fallback = res.status === 404
            ? { name: 'Shop Not Found', address: '' }
            : { name: 'Error fetching shop', address: '' };
          return setShop(fallback);
        }
        const shopData = await res.json();
        setShop(shopData);
      } catch (error) {
        setShop({ name: 'Error fetching shop', address: '' });
        console.error('Failed to fetch shop info:', error);
      }
    };
    fetchShop();
  }, [shopSlug]);

  const handleMouseEnter = (index) => setExpandedIndex(index);
  const handleMouseLeave = () => setExpandedIndex(null);

  return (
    <header className="header">
      <div className="left-box">
        <img src={logo} alt="Logo" className="logo" />
        <div className="shop-info">
          {shop ? (
            <>
              <span className="shop-name">{shop.name}</span>
              {shop.address && <span className="shop-address">{shop.address}</span>}
              {shop.phone && (
                <span className="shop-phone">
                  📞 <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                </span>
              )}
            </>
          ) : (
            <span>Loading shop info...</span>
          )}
        </div>
      </div>

      <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
        <ul className="nav-list">
          {navItems.map((item, index) => (
            <li
              key={item.name}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <Link to={item.id} className="dropdown-toggle">{item.name}</Link>
              {expandedIndex === index && (
                <div className="dropdown-content">
                  {Array.isArray(item.description) &&
                    item.description.map((desc, idx) => (
                      <div key={idx} className="dropdown-item">{desc}</div>
                    ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="right-box">
        <span className="powered-by">Powered by <strong>ConnectFREE4U</strong></span>
      </div>
    </header>
  );
};

export default Header;
