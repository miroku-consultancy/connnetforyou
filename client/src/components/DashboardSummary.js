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

  // ✅ Clear session info on mount (only once)
  useEffect(() => {
    localStorage.removeItem('authToken');
    clearAllCarts();
    setUser(null);
  }, []); // ✅ Empty dependency array ensures it only runs once

  // Auto-scroll logic
  useEffect(() => {
    const startAutoScroll = () => {
      intervalRef.current = setInterval(() => {
        setIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % shops.length;
          const scrollContainer = scrollRef.current;
          if (scrollContainer) {
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
    navigate(`/${shop}/login`);
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
      <p className="dashboard-subtitle">Select a shop below to login</p>

      <div className="carousel-container" ref={scrollRef}>
        {shops.map((shop, i) => (
          <motion.div
            className={`shop-card ${i === index ? 'active' : ''}`}
            key={shop}
            onMouseDown={handleUserInteractionStart}
            onMouseUp={handleUserInteractionEnd}
            onTouchStart={handleUserInteractionStart}
            onTouchEnd={handleUserInteractionEnd}
            onClick={() => handleClick(shop)}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="shop-image-placeholder">{shopIcons[shop] || "🏬"}</div>
            <div className="shop-name">{displayName(shop)}</div>
            <div className="shop-login-cta">Click to login</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
