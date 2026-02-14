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
  "RajeevVegStore": "🥬",
  "Ganga-Medical-hall": "💊",
  "Desi-swaad": "🍛",
  "Home-chef": "🥮",
  "TheVegKingFastFood": "🥡",
  "Zerocollection": "🌅",
  "DivineCafe&FastFood": "🥡",
  "YadavTransport": "🚚",
  "PatanjaliArogyaKendra": "🌿",
  "SecondWifeFamilyRestaurant": "👩‍🍳",
  "NaginderLittiHouse": "🍘",
  "FarukShawarmaPoint": "🍛",
  "AardeesChickenShicken": "🍗",
  "OmSaiKitchen": "🍽️",
  "BalajiGrill": "🔥",
  "MohanLamaAmazingMomos": "🥟",
  "RajaZaikaKalkattaKathiRoll": "🌯",
  "ShadhuIcecream": "🧁",
};

const displayName = (slug) =>
  slug.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/&/g, ' & ');

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  const [shops, setShops] = useState([]);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visitCount, setVisitCount] = useState(null);

  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  // 🔹 Visit count
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

  // 🔹 Fetch shops with geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const res = await fetch(
              `https://connnet4you-server.onrender.com/api/shops?lat=${latitude}&lng=${longitude}`
            );
            const data = await res.json();
            setShops(Array.isArray(data) ? data : []);
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

  // 🔹 Scroll helper (USED BY DOTS + AUTO SCROLL)
  const scrollToIndex = (i) => {
    const container = scrollRef.current;
    const firstCard = container?.children?.[0];

    if (container && firstCard) {
      const gap = 24; // must match CSS gap
      const width = firstCard.offsetWidth + gap;
      container.scrollTo({ left: width * i, behavior: 'smooth' });
      setIndex(i);
    }
  };

  // 🔹 Auto scroll
  useEffect(() => {
    if (!isPaused && shops.length > 0) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => {
          const next = (prev + 1) % shops.length;
          scrollToIndex(next);
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
    const extensions = ['jpeg', 'jpg', 'png', 'JPG'];
    let attempt = 0;

    return (
      <img
        className="shop-image"
        src={`${baseUrl}/${shop.slug}.${extensions[0]}`}
        alt={shop.name || displayName(shop.slug)}
        onError={(e) => {
          attempt++;
          if (attempt < extensions.length) {
            e.currentTarget.src = `${baseUrl}/${shop.slug}.${extensions[attempt]}`;
          } else {
            e.currentTarget.src = `${baseUrl}/logo.png`;
          }
        }}
      />
    );
  };

  const fallbackShops = Object.keys(shopIcons).map((slug) => ({ slug }));

  const list = shops.length > 0 ? shops : fallbackShops;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛒 Welcome to ConnectFREE4U digital</h1>

      {visitCount !== null && (
        <p className="dashboard-visit-count">👁 Total Visits: {visitCount}</p>
      )}

      <p className="dashboard-subtitle">
        {shops.length > 0
          ? "Discover shops near you!"
          : "No nearby shops found. Please enable location access."}
      </p>

      <div
        className="carousel-container"
        ref={scrollRef}
        onMouseEnter={handleUserInteractionStart}
        onMouseLeave={handleUserInteractionEnd}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
      >
        {list.map((shop, i) => (
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

      {/* 🔹 DOTS */}
      <div className="carousel-dots">
        {list.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => scrollToIndex(i)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
