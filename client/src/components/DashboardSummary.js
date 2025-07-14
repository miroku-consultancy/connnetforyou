import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './DashboardSummary.css';
import { useCart } from './CartContext';
import { useUser } from './UserContext';

const shopIcons = {
  "Kanji-Sweets": "🥜✨",
  "ALNazeerMuradabadiChickenBiryani": "🍗",
  "Janta7DaysChineseFastFood": "🥡",
  "QureshiKababCenter": "🍢",
  "Vow-vista": "🌅",
  "SanjayVegStore": "🥬",
  "Ganga-Medical-hall": "💊",
  "Desi-swaad": "🍛",
  "Home-chef": "🥮"
};

const displayName = (slug) =>
  slug.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

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
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const res = await fetch(
              `https://connnet4you-server.onrender.com/api/shops?lat=${latitude}&lng=${longitude}`
            );
            const data = await res.json();
            console.log('Fetched shops:', data);
            if (Array.isArray(data)) {
              setShops(data);
            } else {
              console.error('Unexpected format:', data);
              setShops([]);
            }
          } catch (e) {
            console.error('Failed to fetch shops:', e);
            setShops([]);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setShops([]); // default to empty
        }
      );
    } else {
      console.warn('No geolocation support');
      setShops([]);
    }
  }, []);

  useEffect(() => {
    if (!isPaused && shops.length > 0) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => {
          const next = (prev + 1) % shops.length;
          const container = scrollRef.current;
          if (container?.firstChild) {
            const width = container.firstChild.offsetWidth + 24;
            container.scrollTo({ left: width * next, behavior: 'smooth' });
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, shops]);

  const handleClick = (slug) => navigate(`/${slug}/products`);
  const handleUserInteractionStart = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
  };
  const handleUserInteractionEnd = () => setIsPaused(false);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛒 Welcome to ConnectFREE4U</h1>
      <p className="dashboard-subtitle">
        {shops.length > 0 ? "Select a shop below to see the product list" : "No nearby shops found."}
      </p>
      <div
        className="carousel-container"
        ref={scrollRef}
        onMouseEnter={handleUserInteractionStart}
        onMouseLeave={handleUserInteractionEnd}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
      >
        {(shops.length > 0 ? shops : Object.keys(shopIcons).map((slug) => ({ slug }))).map((shop, i) => (
          <motion.div
            key={shop.slug}
            className={`shop-card ${i === index ? 'active' : ''}`}
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
                  className="shop-image"
                  src={`https://connnet4you-server.onrender.com/${shop.image_url}`}
                  alt={shop.name || displayName(shop.slug)}
                />
              ) : (
                shopIcons[shop.slug] || "🏬"
              )}
            </div>
            <h2 className="shop-name">{displayName(shop.slug)}</h2>
            {shop.address && <p className="shop-address">{shop.address}</p>}
            <div className="shop-login-cta">Click to explore the products</div>
          </motion.div>
        ))}
      </div>

      <div className="carousel-dots">
        {(shops.length > 0 ? shops : Object.keys(shopIcons)).map((_, i) => (
          <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
