import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './DashboardSummary.css';

import { useCart } from './CartContext';
import { useUser } from './UserContext';

const shops = [
  "Kanji-Sweets",
  "ALNazeerMuradabadiChickenBiryani",
  "Janta7DaysChineseFastFood",
  "QureshiKababCenter",
  "Vow-vista",
  "SanjayVegStore",
  "Ganga-Medical-hall",
  "Desi-swaad"
];

const displayName = (shop) =>
  shop.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

const shopIcons = {
  "Kanji-Sweets": "🍬",
  "ALNazeerMuradabadiChickenBiryani": "🍗",
  "Janta7DaysChineseFastFood": "🥡",
  "QureshiKababCenter": "🍢",
  "Vow-vista": "🌅",
  "SanjayVegStore": "🥬",
  "Ganga-Medical-hall": "💊",
  "Desi-swaad": "🍛"
};

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  // Clear session info on mount
  useEffect(() => {
    localStorage.removeItem('authToken');
    clearAllCarts();
    setUser(null);
  }, []); 

  // Auto-scroll logic
  useEffect(() => {
    const startAutoScroll = () => {
      intervalRef.current = setInterval(() => {
        setIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % shops.length;
          const scrollContainer = scrollRef.current;
          if (scrollContainer && scrollContainer.firstChild) {
            const cardWidth = scrollContainer.firstChild.offsetWidth + 24;
            scrollContainer.scrollTo({
              left: cardWidth * nextIndex,
              behavior: 'smooth',
            });
          }
          return nextIndex;
        });
      }, 3000);
    };

    if (!isPaused) {
      startAutoScroll();
    }

    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  const handleClick = (shop) => {
    navigate(`/${shop}/products`);
  };

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
            key={shop}
            role="button"
            aria-label={`Explore ${displayName(shop)}`}
            onClick={() => handleClick(shop)}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="shop-image-placeholder">{shopIcons[shop] || "🏬"}</div>
            <h2 className="shop-name">{displayName(shop)}</h2>
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
