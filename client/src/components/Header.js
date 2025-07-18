// components/Header.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import MenuBar from './MenuBar';
import { FaBars, FaTimes } from 'react-icons/fa'; // for menu icons

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Header = () => {
  const location = useLocation();
  const shopSlug = location.pathname.split('/')[1] || '';
  const [shop, setShop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // for toggling menu

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${suffix}`;
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!shopSlug || shopSlug === 'dashboard') return;
    fetch(`${API_BASE_URL}/api/shops/${shopSlug}`)
      .then(res => {
        if (res.ok) return res.json();
        if (res.status === 404)
          return { name: 'Shop Not Found', slug: null, address: '', phone: '' };
        return Promise.reject();
      })
      .then(setShop)
      .catch(err => {
        console.error('Shop fetch error:', err);
        setShop({ name: 'Error fetching shop', slug: null, address: '', phone: '' });
      });
  }, [shopSlug]);

  const shopLogoSrc = shop?.slug
    ? `/images/shops/${shop.slug}.JPG`
    : '/images/shops/logo.png';

  return (
    <header className="header">
      {/* Left: Logo and shop info */}
      <div className="left-box">
        <img
          src={shopLogoSrc}
          alt={`${shop?.name || 'Shop'} logo`}
          className="logo"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/shops/logo.png';
          }}
        />
        <div className="shop-info">
          {shop ? (
            <>
              <span className="shop-name">{shop.name}</span>
              {shop.address && <span className="shop-address">{shop.address}</span>}
              {shop.phone === "9643883821" ? (
                <span className="shop-phone">
                  📧 <a href="mailto:connectfree4u@gmail.com">connectfree4u@gmail.com</a>
                </span>
              ) : (
                shop.phone && (
                  <span className="shop-phone">
                    📞 <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                  </span>
                )
              )}

            </>
          ) : (
            <span>Loading shop info…</span>
          )}
        </div>
      </div>

      {/* Toggle Menu Button for mobile */}
      <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Center: MenuBar */}
      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        <MenuBar />
      </nav>

      {/* Right: Shop hours + branding */}
      <div className="right-box">
        {shop?.open_time && shop?.close_time && (
          <span className="shop-hours">
            🕒 <strong>Open Hours:</strong> {formatTime(shop.open_time)} – {formatTime(shop.close_time)}
          </span>
        )}
        <span className="powered-by">
          Powered by <strong>ConnectFREE4U</strong>
        </span>
      </div>
    </header>
  );
};

export default Header;
