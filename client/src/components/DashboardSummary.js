import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardSummary.css';

const shops = [
  "Kanji-Sweets",
  "SanjayVegStore",
  "Ganga-Medical-hall",
  "ALNazeerMuradabadiChickenBiryani",
  "Janta7DaysChineseFastFood",
  "QureshiKababCenter",
  "Vow-vista"
];

const displayName = (shop) =>
  shop.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (index + 1) % shops.length;
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        const cardWidth = scrollContainer.firstChild.offsetWidth + 20;
        scrollContainer.scrollTo({
          left: cardWidth * nextIndex,
          behavior: 'smooth',
        });
        setIndex(nextIndex);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [index]);

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
