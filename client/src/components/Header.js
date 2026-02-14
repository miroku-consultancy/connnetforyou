import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Header.css';
import MenuBar from './MenuBar';
import { FaBars, FaTimes } from 'react-icons/fa';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Header = () => {
  const location = useLocation();
  const [shop, setShop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const shopSlug = location.pathname.split('/')[1] || '';

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

  // Hide header on dashboard (you said you’ll remove hero text there)
  if (location.pathname === '/dashboard') {
    return null;
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${suffix}`;
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const isShopOpen = () => {
    if (!shop?.open_time || !shop?.close_time) return true;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = shop.open_time.split(':').map(Number);
    const [closeH, closeM] = shop.close_time.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  };

  const shopLogoSrc = shop?.slug
    ? `/images/shops/${shop.slug}.JPG`
    : '/images/shops/logo.png';

  return (
    <motion.header
      className="header"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Left */}
      <div className="left-box">
        <motion.img
          src={shopLogoSrc}
          alt="Shop logo"
          className="logo"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/shops/logo.png';
          }}
          whileHover={{ scale: 1.08, rotate: 2 }}
          transition={{ type: "spring", stiffness: 300 }}
        />

        <div className="shop-info">
          {shop ? (
            <>
              {/* THIS uses shop.name and gives Dashboard hero feel */}
              <motion.h1
                className="brand-title"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {shop.name}
              </motion.h1>

              {shop.address && <span className="shop-address">{shop.address}</span>}
              {shop.phone && (
                <span className="shop-phone">
                  📞 <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                </span>
              )}
            </>
          ) : (
            <span className="shop-loading">Loading shop info…</span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button className="menu-toggle" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Center Menu */}
      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        <MenuBar closeMenu={() => setMenuOpen(false)} />
      </nav>

      {/* Right */}
      <div className="right-box">
        {shop?.open_time && shop?.close_time && (
          <span className="shop-hours">
            🕒 {formatTime(shop.open_time)} – {formatTime(shop.close_time)}
            <span className={`status-badge ${isShopOpen() ? 'open' : 'closed'}`}>
              {isShopOpen() ? '🟢 Open' : '🔴 Closed'}
            </span>
          </span>
        )}
        <span className="powered-by">
          Powered by <strong>ConnectFREE4U</strong>
        </span>
      </div>
    </motion.header>
  );
};

export default Header;
