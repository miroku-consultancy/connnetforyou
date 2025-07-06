// DashboardSummary.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardSummary.css';

import { useCart } from './CartContext';    // ✅ import cart context
import { useUser } from './UserContext';    // ✅ import user context

const shops = [
  "Kanji-Sweets",
  "ALNazeerMuradabadiChickenBiryani",
  "Janta7DaysChineseFastFood",
  "QureshiKababCenter",
  "Vow-vista",
  "SanjayVegStore",
  "Ganga-Medical-hall",
];

const displayName = (shop) =>
  shop.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const { clearAllCarts } = useCart();      // ✅ get clearAllCarts from context
  const { setUser } = useUser();             // ✅ get setUser and refreshUser once
  // Note: We are not using refreshUser here to avoid loop

  // ✅ Clear all session info on dashboard mount
useEffect(() => {
  localStorage.removeItem('authToken');
  clearAllCarts();
  setUser(null);  // choose one of these, not both
  // refreshUser();  // DO NOT call this here if you called setUser
}, [clearAllCarts, setUser]);


  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % shops.length;
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
          const cardWidth = scrollContainer.firstChild.offsetWidth + 20;
          scrollContainer.scrollTo({
            left: cardWidth * nextIndex,
            behavior: 'smooth',
          });
        }
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (shop) => {
    navigate(`/${shop}/login`);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛒 Welcome to ConnectFREE4U</h1>
      <p className="dashboard-subtitle">Select a shop below to login</p>

      <div className="carousel-container" ref={scrollRef}>
        {shops.map((shop, i) => (
          <div
            className={`shop-card ${i === index ? 'active' : ''}`}
            key={shop}
            onClick={() => handleClick(shop)}
          >
            <div className="shop-image-placeholder">🏬</div>
            <div className="shop-name">{displayName(shop)}</div>
            <div className="shop-login-cta">Click to login</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
