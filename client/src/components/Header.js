import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Header.css';
import logo from '../assets/images/logo.png';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Header = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [shop, setShop] = useState(null);
  const { shopSlug } = useParams();

  useEffect(() => {
    // Fetch navigation items (no auth required)
    const fetchNavItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/navigation`);
        if (!response.ok) throw new Error('Failed to fetch navigation');
        const data = await response.json();
        if (data && Array.isArray(data.navItems)) {
          setNavItems(data.navItems);
        } else {
          setNavItems([]);
        }
      } catch (error) {
        setNavItems([]);
        console.error('Error fetching nav items:', error);
      }
    };
    fetchNavItems();
  }, []);

  useEffect(() => {
    if (!shopSlug) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shops/${shopSlug}`); // No auth header here
        if (!res.ok) {
          if (res.status === 404) {
            setShop({ name: 'Shop Not Found', address: '' });
          } else {
            setShop({ name: 'Error fetching shop', address: '' });
          }
          return;
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
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
        <div className="company-name">
          <span>ConnectFree4U</span>
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
              <Link
                to={item.id}
                className="dropdown-toggle"
                aria-label={`Toggle ${item.name} dropdown`}
              >
                {item.name}
              </Link>
              {expandedIndex === index && (
                <div className="dropdown-content">
                  {Array.isArray(item.description) &&
                    item.description.map((desc, idx) => (
                      <div key={idx} className="dropdown-item">
                        {desc}
                      </div>
                    ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Show shop name and address */}
      <div className="header-right">
        {shop ? (
          <>
            <span className="shop-name">{shop.name}</span>
            {shop.address && <span className="shop-address">{shop.address}</span>}
          </>
        ) : (
          <span>Loading shop info...</span>
        )}
      </div>
    </header>
  );
};

export default Header;
