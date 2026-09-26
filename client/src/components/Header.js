import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaHeart,
  FaBell,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";

import "./Header.css";
import MenuBar from "./MenuBar";
import { useTenant } from "../context/TenantContext";

const Header = ({
  searchValue = "",
  onSearchChange,
  onLocationChange,
  notificationCount = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { tenant, loading } = useTenant();
  const shop = tenant?.shop;

  const [menuOpen, setMenuOpen] = useState(false);
  const [locationLoading, setLocationLoading] =
    useState(false);
  const [locationError, setLocationError] =
    useState(false);

  // Root JusPing domain detection
  const hostname =
    window.location.hostname.toLowerCase();

  const isRootDomain =
    hostname === "jusping.com" ||
    hostname === "www.jusping.com" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleSearch = (event) => {
    onSearchChange?.(event.target.value);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }

    setLocationLoading(true);
    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationLoading(false);
        setLocationError(false);

        // Let DashboardSummary call the existing shops API.
        onLocationChange?.({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      (error) => {
        console.warn(
          "Location unavailable:",
          error.message
        );

        setLocationLoading(false);
        setLocationError(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // ==========================================
  // ROOT JUSPING HEADER
  // ==========================================

  if (isRootDomain) {
    return (
      <motion.header
        className="jp-header"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      >
        {/* Brand */}
        <div
          className="jp-brand"
          onClick={() => goTo("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              goTo("/");
            }
          }}
        >
          <div className="jp-logo">
  <img
    src="/images/logo.png"
    alt="JusPing"
    className="jp-logo-image"
  />
</div>

          <div className="jp-brand-text">
            <div className="jp-brand-name">
              Jus<span>Ping</span>
            </div>

            <small>
              Local Shops • Services • Community
            </small>
          </div>
        </div>

        {/* Search */}
        <div className="jp-search">
          <FaSearch className="jp-search-icon" />

          <input
            type="search"
            value={searchValue}
            placeholder="Search shops, services, products..."
            onChange={handleSearch}
            aria-label="Search shops and services"
          />

          {searchValue && (
            <button
              className="jp-clear"
              onClick={() =>
                onSearchChange?.("")
              }
              aria-label="Clear search"
              type="button"
            >
              ×
            </button>
          )}
        </div>

        {/* Near You */}
        <button
          className="jp-location"
          // onClick={handleLocation}
          type="button"
          disabled={locationLoading}
        >
          <span className="jp-location-pin">
            <FaMapMarkerAlt />
          </span>

          <span>
            <strong>
              {locationLoading
                ? "Locating..."
                : "Near You"}
            </strong>

            <small>
              {locationError
                ? "Location unavailable"
                : locationLoading
                ? "Finding nearby shops"
                : "Use my location"}
            </small>
          </span>
        </button>

        {/* Favorites */}
        <button
          className="jp-header-icon"
          aria-label="Favorites"
          // onClick={() => goTo("/favorites")}
          type="button"
        >
          <FaHeart />
        </button>

        {/* Notifications */}
        <button
          className="jp-header-icon jp-notification"
          aria-label="Notifications"
          // onClick={() => goTo("/notifications")}
          type="button"
        >
          <FaBell />

          {notificationCount > 0 && (
            <i>{notificationCount}</i>
          )}
        </button>

        {/* Menu */}
        <button
          className="jp-header-icon"
          aria-label="Menu"
          // onClick={() => goTo("/more")}
          type="button"
        >
          <FaBars />
        </button>
      </motion.header>
    );
  }

  // ==========================================
  // EXISTING TENANT / SHOP HEADER
  // ==========================================

  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);

    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    return `${h}:${minute} ${suffix}`;
  };

  const isShopOpen = () => {
    if (!shop?.open_time || !shop?.close_time) {
      return true;
    }

    const now = new Date();
    const nowMinutes =
      now.getHours() * 60 + now.getMinutes();

    const [openH, openM] =
      shop.open_time.split(":").map(Number);

    const [closeH, closeM] =
      shop.close_time.split(":").map(Number);

    const openMinutes =
      openH * 60 + openM;

    const closeMinutes =
      closeH * 60 + closeM;

    // Supports stores with overnight operating hours.
    if (closeMinutes < openMinutes) {
      return (
        nowMinutes >= openMinutes ||
        nowMinutes <= closeMinutes
      );
    }

    return (
      nowMinutes >= openMinutes &&
      nowMinutes <= closeMinutes
    );
  };

  const shopLogoSrc = shop?.slug
    ? `/images/shops/${shop.slug}.JPG`
    : "/images/shops/logo.png";

  return (
    <motion.header
      className="header"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
    >
      {/* Shop logo and details */}
      <div className="header-top">
        <div className="left-box">
          <motion.img
            src={shopLogoSrc}
            alt="Shop logo"
            className="logo"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "/images/shops/logo.png";
            }}
            whileHover={{ scale: 1.05 }}
          />

          <div className="shop-info">
            {loading ? (
              <span className="shop-loading">
                Loading shop info…
              </span>
            ) : shop ? (
              <>
                <motion.h1
                  className="brand-title"
                  initial={{
                    opacity: 0,
                    y: -6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  {shop.name}
                </motion.h1>

                {shop.address && (
                  <span className="shop-address">
                    {shop.address}
                  </span>
                )}

                {shop.phone && (
                  <span className="shop-phone">
                    📞{" "}
                    <a href={`tel:${shop.phone}`}>
                      {shop.phone}
                    </a>
                  </span>
                )}
              </>
            ) : (
              <span className="shop-loading">
                Shop information unavailable
              </span>
            )}
          </div>
        </div>

        <button
          className="menu-toggle"
          onClick={() =>
            setMenuOpen((prev) => !prev)
          }
          aria-label="Toggle menu"
          type="button"
        >
          {menuOpen ? (
            <FaTimes />
          ) : (
            <FaBars />
          )}
        </button>
      </div>

      {/* Existing tenant menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="nav"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <MenuBar
              closeMenu={() =>
                setMenuOpen(false)
              }
            />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Existing shop hours and status */}
      {shop && (
        <div className="right-box">
          {shop.open_time &&
            shop.close_time && (
              <span className="shop-hours">
                🕒{" "}
                {formatTime(shop.open_time)} –{" "}
                {formatTime(shop.close_time)}

                <span
                  className={`status-badge ${
                    isShopOpen()
                      ? "open"
                      : "closed"
                  }`}
                >
                  {isShopOpen()
                    ? "🟢 Open"
                    : "🔴 Closed"}
                </span>
              </span>
            )}

          <span className="powered-by">
            Powered by{" "}
            <strong>JusPing</strong>
          </span>
        </div>
      )}
    </motion.header>
  );
};

export default Header;