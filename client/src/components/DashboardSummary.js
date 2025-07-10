import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './DashboardSummary.css';
import { useCart } from './CartContext';
import { useUser } from './UserContext';

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);
  const [shops, setShops] = useState([]);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  useEffect(() => {
    localStorage.removeItem('authToken');
    clearAllCarts();
    setUser(null);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://connnet4you-server.onrender.com/api/shops?lat=${latitude}&lng=${longitude}`
          );
          const data = await res.json();
          setShops(data || []);
        } catch (err) {
          console.error('❌ Failed to fetch nearby shops:', err);
        }
      }, (err) => {
        console.warn('⚠️ Location access denied or failed.', err);
      });
    }
  }, []);

  useEffect(() => {
    if (!isPaused && shops.length > 0) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => {
          const next = (prev + 1) % shops.length;
          const scrollContainer = scrollRef.current;
          if (scrollContainer?.firstChild) {
            const cardWidth = scrollContainer.firstChild.offsetWidth + 24;
            scrollContainer.scrollTo({ left: cardWidth * next, behavior: 'smooth' });
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, shops]);

  const handleClick = (slug) => {
    navigate(`/${slug}/products`);
  };

  const displayName = (slug) =>
    slug.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

  const handleUserInteractionStart = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
  };

  const handleUserInteractionEnd = () => {
    setIsPaused(false);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛒 Welcome to ConnectFREE4U</h1>
      <p className="dashboard-subtitle">Select a shop below to see the product list</p>

      <div
        className="carousel-container"
        ref={scrollRef}
        onMouseEnter={handleUserInteractionStart}
        onMouseLeave={handleUserInteractionEnd}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
      >
        {shops.map((shop, i) => (
          <motion.div
            className={`shop-card ${i === index ? 'active' : ''}`}
            key={shop.slug}
            role="button"
            onClick={() => handleClick(shop.slug)}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="shop-image-placeholder">
              {shop.image_url ? (
                <img
                  src={`https://connnet4you-server.onrender.com/${shop.image_url}`}
                  alt={shop.name}
                  className="shop-image"
                />
              ) : (
                '🏬'
              )}
            </div>
            <h2 className="shop-name">{displayName(shop.slug)}</h2>
            <p className="shop-address">{shop.address}</p>
            <div className="shop-login-cta">Click to explore the products</div>
          </motion.div>
        ))}
      </div>

      <div className="carousel-dots">
        {shops.map((_, i) => (
          <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
