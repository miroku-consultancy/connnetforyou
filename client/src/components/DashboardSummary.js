import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const displayName = (slug) => slug.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/&/g, ' & ');

const getRating = (slug) => {
  const ratings = [4.2, 4.5, 4.8, 4.3, 4.9, 4.1, 4.7, 4.6, 4.4, 4.0];
  return ratings[(slug.length % ratings.length)];
};

const DashboardSummary = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  const [shops, setShops] = useState([]);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visitCount, setVisitCount] = useState(null);
  const [loading, setLoading] = useState(true);

  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  // ✅ VISIT COUNT EFFECT
  useEffect(() => {
    const logVisitAndFetchCount = async () => {
      try {
        await fetch('https://connnet4you-server.onrender.com/api/analytics/visit', { method: 'POST' });
        const res = await fetch('https://connnet4you-server.onrender.com/api/analytics/visit-count');
        const data = await res.json();
        setVisitCount(data.count ?? data.total ?? data.visits ?? null);
      } catch (err) {
        console.error('Visit log/fetch error:', err);
      }
    };
    logVisitAndFetchCount();
  }, []);

  // ✅ GEOLOCATION + SHOPS EFFECT
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            setLoading(true);
            const res = await fetch(
              `https://connnet4you-server.onrender.com/api/shops?lat=${latitude}&lng=${longitude}`
            );
            const data = await res.json();
            setShops(Array.isArray(data) ? data : []);
            setLoading(false);
          } catch (e) {
            console.error('Failed to fetch shops:', e);
            setShops([]);
            setLoading(false);
          }
        },
        () => {
          setShops([]);
          setLoading(false);
        }
      );
    } else {
      setShops([]);
      setLoading(false);
    }
  }, []);

  // ✅ SCROLL FUNCTION
  const scrollToIndex = (i) => {
    const container = scrollRef.current;
    const firstCard = container?.children?.[0];
    if (container && firstCard) {
      const gap = 24;
      const width = firstCard.offsetWidth + gap;
      container.scrollTo({ left: width * i, behavior: 'smooth' });
      setIndex(i);
    }
  };

  // ✅ AUTO-SCROLL EFFECT
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

  const handleUserInteractionStart = () => setIsPaused(true);
  const handleUserInteractionEnd = () => setIsPaused(false);

  // ✅ IMAGE FALLBACK FUNCTION
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="shimmer" style={{ width: 50, height: 50, margin: '0 auto 20px', borderRadius: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <p>Loading nearby shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Animated Hero */}
      <motion.div 
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="hero-gradient"></div>
        <div className="floating-orbs">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="orb" 
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
        <div className="hero-content">
          <motion.h1 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ConnectFREE4U
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Discover nearby shops, chat & order instantly
          </motion.p>
          {visitCount !== null && (
            <motion.div className="visit-chip" 
              whileHover={{ scale: 1.05 }}
            >
              👁 {visitCount.toLocaleString()} visits
            </motion.div>
          )}
          <motion.a
            className="install-btn"
            href="https://play.google.com/store/apps/details?id=com.connectfree4u.connectfree4u"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            📲 Install App
          </motion.a>
        </div>
      </motion.div>

      <h2 className="section-title">Nearby Shops</h2>

      {/* Enhanced Carousel */}
      <motion.div
        className="carousel-container"
        ref={scrollRef}
        onMouseEnter={handleUserInteractionStart}
        onMouseLeave={handleUserInteractionEnd}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        whileDrag={{ scale: 1.01 }}
      >
        <AnimatePresence>
          {list.map((shop, i) => (
            <motion.div
              key={shop.slug}
              className={`shop-card ${i === index ? 'active' : ''}`}
              role="button"
              onClick={() => handleClick(shop.slug)}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ 
                opacity: 1, 
                scale: i === index ? 1.08 : 1,
                y: 0,
                rotateY: i === index ? -5 : 0
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ 
                scale: 1.1, 
                y: -12,
                boxShadow: "0 25px 50px rgba(34, 197, 94, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: i * 0.1
              }}
            >
              <div className="shop-image-wrap">
                {getImageElement(shop)}
              </div>
              <h3 className="shop-name">{displayName(shop.slug)}</h3>
              {shop.address && <p className="shop-address">{shop.address}</p>}
              <div className="shop-rating">
                ⭐ {getRating(shop.slug).toFixed(1)}
              </div>
              <div className="shop-login-cta">Open Shop →</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Glowing Dots */}
      <div className="carousel-dots">
        {list.map((_, i) => (
          <motion.span
            key={i}
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => scrollToIndex(i)}
            whileHover={{ scale: 1.4 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Background Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            className="particle" 
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ duration: 10 + i * 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
