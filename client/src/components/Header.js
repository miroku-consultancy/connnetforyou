import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Header = () => {
  const location = useLocation();
  const shopSlug = location.pathname.split('/')[1] || null;

  const [navItems, setNavItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/navigation`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setNavItems(data.navItems || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!shopSlug) return setShop(null);

    fetch(`${API_BASE_URL}/api/shops/${shopSlug}`)
      .then(res => {
        if (res.ok) return res.json();
        if (res.status === 404) return { name: 'Shop Not Found', slug: null, address: '', phone: '' };
        return Promise.reject();
      })
      .then(setShop)
      .catch(() => setShop({ name: 'Error fetching shop', slug: null, address: '', phone: '' }));
  }, [shopSlug]);

  const handleMouseEnter = i => setExpandedIndex(i);
  const handleMouseLeave = () => setExpandedIndex(null);

  const shopLogoSrc = shop?.slug
    ? `${process.env.PUBLIC_URL}/images/shops/${shop.slug}.jpg`
    : `${process.env.PUBLIC_URL}/images/logo.jpg`;

  return (
    <header className="header">
      <div className="left-box">
        <img
          src={shopLogoSrc}
          alt={`${shop?.name || 'Shop'} logo`}
          className="logo"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${process.env.PUBLIC_URL}/images/logo.jpg`; }}
        />
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

      <nav className="nav">
        <ul className="nav-list">
          {navItems.map((itm, idx) => (
            <li
              key={idx}
              onMouseEnter={() => handleMouseEnter(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <Link to={itm.id} className="dropdown-toggle">{itm.name}</Link>
              {expandedIndex === idx && itm.description?.length > 0 && (
                <div className="dropdown-content">
                  {itm.description.map((d, i2) => (
                    <div key={i2} className="dropdown-item">{d}</div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="right-box">
        <span className="powered-by">
          Powered by <strong>ConnectFREE4U</strong>
        </span>
      </div>
    </header>
  );
};

export default Header;
