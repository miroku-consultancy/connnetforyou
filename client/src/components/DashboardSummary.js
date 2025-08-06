import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './DashboardSummary.css';
import { useCart } from './CartContext';
import { useUser } from './UserContext';

const shopIcons = {
  "Kanji-Sweets": "🧁",
  "ALNazeerMuradabadiChickenBiryani": "🍗",
  "Janta7DaysChineseFastFood": "🥡",
  "QureshiKababCenter": "🍢",
  "Vow-vista": "🌅",
  "SanjayVegStore": "🥬",
  "Ganga-Medical-hall": "💊",
  "Desi-swaad": "🍛",
  "Home-chef": "🥮",
  "TheVegKingFastFood":"🥡"
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
  const [visitCount, setVisitCount] = useState(null); // ✅ visit count
  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  // ✅ Log visit and fetch total count
  useEffect(() => {
    const logVisitAndFetchCount = async () => {
      try {
        await fetch('https://connnet4you-server.onrender.com/api/analytics/visit', { method: 'POST' });
        const res = await fetch('https://connnet4you-server.onrender.com/api/analytics/visit-count');
        const data = await res.json();
        setVisitCount(data.count);
      } catch (err) {
        console.error('Visit log/fetch error:', err);
      }
    };
    logVisitAndFetchCount();
  }, []);

  // useEffect(() => {
  //   localStorage.removeItem('authToken');
  //   clearAllCarts();
  //   setUser(null);
  // }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const res = await fetch(
              `https://connnet4you-server.onrender.com/api/shops?lat=${latitude}&lng=${longitude}`
            );
            const data = await res.json();
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
          setShops([]);
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

  const getImageElement = (shop) => {
    const baseUrl = "https://www.connectfree4u.com/images/shops";
    const extensions = ['jpeg', 'jpg', 'png'];
    let attempt = 0;

    return (
      <img
        className="shop-image"
        src={`${baseUrl}/${shop.slug}.${extensions[0]}`}
        alt={shop.name || displayName(shop.slug)}
        onError={(e) => {
          attempt++;
          if (attempt < extensions.length) {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `${baseUrl}/${shop.slug}.${extensions[attempt]}`;
          } else {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `${baseUrl}/logo.png`;
          }
        }}
      />
    );
  };

  const fallbackShops = Object.keys(shopIcons).map((slug) => ({ slug }));

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛒 Welcome to ConnectFREE4U</h1>
      {visitCount !== null && (
        <p className="dashboard-visit-count">👁 Total Visits: {visitCount}</p>
      )}
      <p className="dashboard-subtitle">
        {shops.length > 0
          ? "Please enable location access to discover shops near you!"
          : "No nearby shops found."}
      </p>

      <div
        className="carousel-container"
        ref={scrollRef}
        onMouseEnter={handleUserInteractionStart}
        onMouseLeave={handleUserInteractionEnd}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
      >
        {(shops.length > 0 ? shops : fallbackShops).map((shop, i) => (
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
              {getImageElement(shop)}
            </div>
            <h2 className="shop-name">{displayName(shop.slug)}</h2>
            {shop.address && <p className="shop-address">{shop.address}</p>}
            <div className="shop-login-cta">Click to explore the products</div>
          </motion.div>
        ))}
      </div>

      <div className="carousel-dots">
        {(shops.length > 0 ? shops : fallbackShops).map((_, i) => (
          <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
