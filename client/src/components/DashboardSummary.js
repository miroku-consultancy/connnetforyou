import React, { useEffect, useMemo, useState } from "react";
import "./DashboardSummary.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useUser } from "./UserContext";

const API_BASE_URL = "https://connnet4you-server.onrender.com";
const SERVICES_API =
  "https://city-home-services.jusping.com/services";
const IMAGE_BASE_URL = "https://www.jusping.com/images/shops";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.connectfree4u.connectfree4u";

// Keep your original shop slug mappings
const shopIcons = {
  "Kanji-Sweets": "🧁",
  ALNazeerMuradabadiChickenBiryani: "🍗",
  Janta7DaysChineseFastFood: "🥡",
  QureshiKababCenter: "🍢",
  "Vow-vista": "🌅",
  RajeevVegStore: "🥬",
  "Ganga-Medical-hall": "💊",
  "Desi-swaad": "🍛",
  "Home-chef": "🥮",
  TheVegKingFastFood: "🥡",
  Zerocollection: "🌅",
  "DivineCafe&FastFood": "🥡",
  YadavTransport: "🚚",
  PatanjaliArogyaKendra: "🌿",
  SecondWifeFamilyRestaurant: "👩‍🍳",
  NaginderLittiHouse: "🍘",
  FarukShawarmaPoint: "🍛",
  AardeesChickenShicken: "🍗",
  OmSaiKitchen: "🍽️",
  BalajiGrill: "🔥",
  MohanLamaAmazingMomos: "🥟",
  RajaZaikaKalkattaKathiRoll: "🌯",
  ShadhuIcecream: "🧁",
  "City-Home-Services": "🏠",
};

const displayName = (slug = "") =>
  slug
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/&/g, " & ");

// Static service data for image and icon fallback
const staticServices = [
  {
    id: 1,
    name: "Home Cleaning",
    price: 299,
    category: "Home Services",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80",
    icon: "🏠",
  },
  {
    id: 2,
    name: "AC Repair & Service",
    price: 499,
    category: "AC Repair",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80",
    icon: "❄️",
  },
  {
    id: 3,
    name: "Plumber",
    price: 299,
    category: "Plumbing",
    image:
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=500&q=80",
    icon: "🔧",
  },
  {
    id: 4,
    name: "Electrician",
    price: 299,
    category: "Electrical",
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=500&q=80",
    icon: "⚡",
  },
  {
    id: 5,
    name: "Beauty & Wellness",
    price: 499,
    category: "Beauty",
    image:
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=500&q=80",
    icon: "💗",
  },
  {
    id: 6,
    name: "Car/Bike Service",
    price: 499,
    category: "Vehicle Service",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80",
    icon: "🚘",
  },
];

// Match live API services with local images and icons
const getStaticServiceAsset = (service) => {
  const serviceName = (
    service?.title ||
    service?.name ||
    ""
  )
    .toLowerCase()
    .trim();

  const serviceCategory = (service?.category || "")
    .toLowerCase()
    .trim();

  return staticServices.find((item) => {
    const staticName = item.name.toLowerCase().trim();
    const staticCategory = item.category.toLowerCase().trim();

    return (
      (serviceName && staticName === serviceName) ||
      (serviceCategory && staticCategory === serviceCategory)
    );
  });
};

const getServiceImage = (service) =>
  getStaticServiceAsset(service)?.image ||
  service?.image_url ||
  "";

const getServiceIcon = (service) =>
  getStaticServiceAsset(service)?.icon || "🔧";

// Keep future categories commented
const categories = [
  { name: "Shops", icon: "🛒", color: "orange", path: "/shops" },
  { name: "Services", icon: "🔧", color: "blue", path: "/services" },
  // { name: "Chat", icon: "▣", color: "green", path: "/chat" },
  // { name: "Community", icon: "👥", color: "purple", path: "/community" },
  // { name: "Matrimony", icon: "❤️", color: "pink", path: "/matrimony" },
  // { name: "AstroTalk", icon: "✨", color: "yellow", path: "/astrotalk" },
  // { name: "Jobs", icon: "▣", color: "blue", path: "/jobs" },
  // { name: "Real Estate", icon: "⌂", color: "green", path: "/real-estate" },
  // { name: "Premium", icon: "♛", color: "yellow", path: "/premium" },
  // { name: "More", icon: "•••", color: "gray", path: "/more" },
];

const DashboardSummary = () => {
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [visitCount, setVisitCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [notificationCount] = useState(1);

  // NEW: live services state
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const { clearAllCarts } = useCart();
  const { setUser } = useUser();

  // Keep context integrations available.
  // Do not clear carts or reset the user on dashboard render.

  // -----------------------------
  // Visit analytics - existing API
  // -----------------------------
  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/analytics/visit`, {
          method: "POST",
        });

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/visit-count`
        );

        if (!response.ok) return;

        const data = await response.json();

        setVisitCount(
          data.count ?? data.total ?? data.visits ?? null
        );
      } catch (error) {
        console.error("Visit analytics error:", error);
      }
    };

    fetchVisitCount();
  }, []);

  // -----------------------------
  // Nearby shops - existing API
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchShops = async (latitude, longitude) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/shops?lat=${latitude}&lng=${longitude}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }

        const data = await response.json();

        if (!cancelled) {
          setShops(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch shops:", error);

        if (!cancelled) {
          setShops([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!navigator.geolocation) {
      setLocationError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchShops(coords.latitude, coords.longitude);
      },
      (error) => {
        console.warn("Location unavailable:", error.message);

        if (!cancelled) {
          setLocationError(true);
          setLoading(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------
  // NEW: Fetch services from API
  // -----------------------------
useEffect(() => {
  let cancelled = false;

  const fetchServices = async () => {
    try {
      const response = await fetch(
        "https://city-home-services.jusping.com/services"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();

      // Supports array or { services: [] }
      const serviceList = Array.isArray(data)
        ? data
        : Array.isArray(data?.services)
        ? data.services
        : [];

      if (!cancelled) {
        setServices(serviceList);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);

      if (!cancelled) {
        setServices([]);
      }
    } finally {
      if (!cancelled) {
        setServicesLoading(false);
      }
    }
  };

  fetchServices();

  return () => {
    cancelled = true;
  };
}, []);
  // -----------------------------
  // Existing shop navigation
  // -----------------------------
  const handleClick = (slug) => {
    if (!slug) return;

    if (slug.toLowerCase() === "city-home-services") {
      window.location.href =
        "https://city-home-services.jusping.com/services";
      return;
    }

    window.location.href = `https://${slug}.jusping.com/products`;
  };

  // -----------------------------
  // Shop image with existing fallback
  // -----------------------------
  const getShopImage = (shop) => {
    const extensions = ["jpeg", "jpg", "png", "JPG"];

    return (
      <img
        className="jp-shop-img"
        src={`${IMAGE_BASE_URL}/${shop.slug}.${extensions[0]}`}
        alt={shop.name || displayName(shop.slug)}
        loading="lazy"
        onError={(event) => {
          const img = event.currentTarget;
          const attempt = Number(img.dataset.attempt || 0);

          if (attempt < extensions.length - 1) {
            img.dataset.attempt = String(attempt + 1);
            img.src = `${IMAGE_BASE_URL}/${shop.slug}.${extensions[attempt + 1]}`;
          } else {
            img.onerror = null;
            img.src = `${IMAGE_BASE_URL}/logo.png`;
          }
        }}
      />
    );
  };

  // -----------------------------
  // Static fallback shop list
  // -----------------------------
  const fallbackShops = useMemo(
    () =>
      Object.keys(shopIcons).map((slug, index) => ({
        slug,
        name: displayName(slug),
        category:
          slug === "City-Home-Services"
            ? "Home Services"
            : "Local Store",
        address: "Discover this local store",
        distance: `${(0.8 + index * 0.3).toFixed(1)} km`,
      })),
    []
  );

  // Use live API data when available
  const list = shops.length > 0 ? shops : fallbackShops;

  // -----------------------------
  // Search shops
  // -----------------------------
  const filteredShops = useMemo(() => {
    const query = search.toLowerCase().trim();

    return list.filter((shop) => {
      const name = (
        shop.name || displayName(shop.slug)
      ).toLowerCase();

      const address = (shop.address || "").toLowerCase();
      const category = (shop.category || "").toLowerCase();

      return (
        name.includes(query) ||
        address.includes(query) ||
        category.includes(query)
      );
    });
  }, [list, search]);

  const visibleShops = showAll
    ? filteredShops
    : filteredShops.slice(0, 6);

  // -----------------------------
  // Navigation helpers
  // -----------------------------
  const goTo = (path) => {
    navigate(path);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setShowAll(false);
  };

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <div className="jp-loading">
        <div className="jp-loading-logo">J</div>
        <p>Discovering nearby stores...</p>
      </div>
    );
  }

  return (
    <div className="jusping-dashboard">
      {/* HEADER */}
      {/* <header className="jp-header">
        <div className="jp-brand" onClick={() => goTo("/")}>
          <div className="jp-logo-mark">
            <span>●</span>
          </div>

          <div className="jp-brand-text">
            <div className="jp-brand-name">
              Jus<span>Ping</span>
            </div>
            <small>Local Shops • Services • Community</small>
          </div>
        </div>

        <div className="jp-search">
          <span className="jp-search-icon">⌕</span>
          <input
            type="search"
            value={search}
            placeholder="Search shops, services, products..."
            onChange={(event) => handleSearchChange(event.target.value)}
            aria-label="Search shops and services"
          />
          {search && (
            <button
              className="jp-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          className="jp-location"
          onClick={() => {
            if (!navigator.geolocation) {
              setLocationError(true);
              return;
            }

            navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                setLocationError(false);
                setLoading(true);

                fetch(
                  `${API_BASE_URL}/api/shops?lat=${coords.latitude}&lng=${coords.longitude}`
                )
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error("Failed to fetch shops");
                    }
                    return response.json();
                  })
                  .then((data) => {
                    setShops(Array.isArray(data) ? data : []);
                  })
                  .catch((error) => {
                    console.error("Location shop fetch error:", error);
                  })
                  .finally(() => setLoading(false));
              },
              () => setLocationError(true)
            );
          }}
        >
          <span className="jp-location-pin">📍</span>
          <span>
            <strong>Near You</strong>
            <small>
              {locationError ? "Location unavailable" : "Use my location"}
            </small>
          </span>
        </button>

        <button
          className="jp-header-icon"
          aria-label="Favorites"
          onClick={() => goTo("/favorites")}
        >
          ♡
        </button>

        <button
          className="jp-header-icon jp-notification"
          aria-label="Notifications"
          onClick={() => goTo("/notifications")}
        >
          ♧
          {notificationCount > 0 && <i>{notificationCount}</i>}
        </button>

        <button
          className="jp-header-icon"
          aria-label="Menu"
          onClick={() => goTo("/more")}
        >
          ☰
        </button>
      </header> */}

      <main className="jp-main">
        {/* HERO BANNER */}
        <section className="jp-hero">
          <div className="jp-hero-content">
            <h1>
              Everything
              <br />
              You Need, Nearby
            </h1>

            <p>Shops • Services • Community • Chat • More</p>

            <div className="jp-hero-links">
              <span>
                <b className="hero-icon orange">📍</b>
                Local Shops
              </span>
              <span>
                <b className="hero-icon teal">🔧</b>
                Home Services
              </span>
              <span>
                <b className="hero-icon blue">▣</b>
                Chat & Community
              </span>
              {/* <span>
                <b className="hero-icon purple">✥</b>
                Premium Services
              </span> */}
            </div>
          </div>

          <div className="jp-hero-phone">
            <div className="jp-phone">
              <div className="jp-phone-notch" />
              <div className="jp-phone-screen">
                <div className="jp-phone-logo">●</div>
                <h2>
                  Jus<span>Ping</span>
                </h2>
                <p>
                  Connect
                  <br />
                  Shop
                  <br />
                  <b>Chat</b>
                  <br />
                  Grow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY ICONS */}
        <section className="jp-categories">
          {categories.map((category) => (
            <button
              className="jp-category"
              key={category.name}
              onClick={() => goTo(category.path)}
            >
              <span className={`jp-category-icon ${category.color}`}>
                {category.icon}
              </span>
              <span className="jp-category-label">
                {category.name}
              </span>
            </button>
          ))}
        </section>

        {/* DISCOVER SHOPS */}
        <section className="jp-discover">
          <div className="jp-discover-art">
            <div className="jp-store-illustration">
              <span>🏪</span>
              <b>📍</b>
            </div>
          </div>

          <div className="jp-discover-text">
            <h2>Discover Amazing Shops Around You</h2>
            <p>
              Food, groceries, medical, fashion and more – all at your
              fingertips.
            </p>
          </div>

          <button
            className="jp-primary-button"
            onClick={() => goTo("/shops")}
          >
            Find Nearby Shops <span>→</span>
          </button>
        </section>

        {/* NEARBY SHOPS - LIVE API OR STATIC FALLBACK */}
        <section className="jp-section">
          <div className="jp-section-heading">
            <h2>{search ? "Search Results" : "Nearby Shops"}</h2>

            <button onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Less ↑" : "View All"} <span>→</span>
            </button>
          </div>

          {visibleShops.length > 0 ? (
            <div className="jp-card-grid">
              {visibleShops.map((shop) => (
                <article
                  className="jp-shop-card"
                  key={shop.slug}
                  role="link"
                  tabIndex={0}
                  onClick={() => handleClick(shop.slug)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      handleClick(shop.slug);
                    }
                  }}
                >
                  <div className="jp-shop-image">
                    {getShopImage(shop)}
                  </div>

                  <div className="jp-shop-info">
                    <h3>{shop.name || displayName(shop.slug)}</h3>

                    <p className="jp-distance">
                      <span>📍</span>{" "}
                      {shop.distance || shop.distance_km || "Nearby"}
                    </p>

                    <div className="jp-shop-category">
                      <span
                        style={{
                          background:
                            shop.slug === "City-Home-Services"
                              ? "#0871e7"
                              : "#159957",
                        }}
                      >
                        {shopIcons[shop.slug] || "🏪"}
                      </span>
                      {shop.category || "Local Store"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="jp-empty">
              <div className="jp-empty-icon">⌕</div>
              <h3>No stores found</h3>
              <p>Try another shop name or search term.</p>
              <button onClick={() => setSearch("")}>
                Clear search
              </button>
            </div>
          )}

          {locationError && (
            <p className="jp-location-message">
              Location unavailable. Showing available JusPing stores.
            </p>
          )}
        </section>

        {/* POPULAR SERVICES - LIVE API */}
        <section className="jp-section">
          <div className="jp-section-heading">
            <h2>Popular Services</h2>
            <button onClick={() => goTo("/services")}>
              View All <span>→</span>
            </button>
          </div>

          {servicesLoading ? (
            <p>Loading services...</p>
          ) : services.length > 0 ? (
            <div className="jp-card-grid">
              {services.map((service, index) => {
                const serviceName =
                  service.title || service.name || "Service";

                const servicePrice =
                  service.price ?? service.base_price;

                const serviceId =
                  service.id ??
                  service.service_id ??
                  `${serviceName}-${index}`;

                return (
                  <article
                    className="jp-service-card"
                    key={serviceId}
                  >
                    <div className="jp-service-image">
                      <img
                        src={getServiceImage(service)}
                        alt={serviceName}
                        loading="lazy"
                        onError={(event) => {
                          const staticAsset =
                            getStaticServiceAsset(service);

                          if (staticAsset?.image) {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              staticAsset.image;
                          }
                        }}
                      />

                      <span
                        className={`jp-service-badge badge-${index % 6}`}
                      >
                        {getServiceIcon(service)}
                      </span>
                    </div>

                    <div className="jp-service-info">
                      <h3>{serviceName}</h3>

                      <p>
                        From{" "}
                        <strong>
                          {servicePrice != null
                            ? `₹${servicePrice}`
                            : "Contact for price"}
                        </strong>
                      </p>

                      <button
                        onClick={() => goTo("/services")}
                        className="jp-book-button"
                      >
                        Book Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="jp-empty">
              <h3>No services available</h3>
              <p>Please check back later.</p>
            </div>
          )}
        </section>

        {/* COMMUNITY CHAT */}
        <section className="jp-section jp-community-section">
          <div className="jp-section-heading">
            <h2>Community Chat</h2>
            <button onClick={() => goTo("/community")}>
              View All <span>→</span>
            </button>
          </div>

          <div className="jp-community-grid">
            <article className="jp-community-card jp-shop-chat">
              <div className="jp-community-symbol">▣</div>
              <div className="jp-community-content">
                <h3>Shop Owner - Customer Chat</h3>
                <p>
                  Chat directly with your favourite shop owners for orders,
                  support and updates.
                </p>
                <button onClick={() => goTo("/chat")}>
                  Start Chatting <span>→</span>
                </button>
              </div>
              <div className="jp-community-art">🏪</div>
            </article>

            <article className="jp-community-card jp-group-chat">
              <div className="jp-community-symbol">👥</div>
              <div className="jp-community-content">
                <h3>Join Community Chat</h3>
                <p>
                  Connect with people in your area. Discuss, share and stay
                  updated.
                </p>
                <button onClick={() => goTo("/community")}>
                  Join Now <span>→</span>
                </button>
              </div>
              <div className="jp-community-art">🧑‍🤝‍🧑</div>
            </article>
          </div>
        </section>

        {/* PREMIUM SERVICES */}
        {/* <section className="jp-premium">
          <div className="jp-premium-icon">♛</div>

          <div className="jp-premium-text">
            <h2>Explore Premium Services</h2>
            <p>
              Dating <b>•</b> Matrimony <b>•</b> AstroTalk <b>•</b> Jobs
              <b> • </b> Real Estate <b>•</b> And Many More
            </p>
          </div>

          <button onClick={() => goTo("/premium")}>
            Coming Soon <span>→</span>
          </button>

          <div className="jp-premium-art">💑</div>
        </section> */}
      </main>

      {/* FOOTER */}
      <footer className="jp-footer">
        <div className="jp-footer-main">
          <div className="jp-footer-brand">
            <div className="jp-footer-logo">
              <div className="jp-logo-mark">
                <span>●</span>
              </div>
              <h2>
                Jus<span>Ping</span>
              </h2>
            </div>
            <p>Connect Local • Build Community • Grow Together</p>
          </div>

          <div className="jp-footer-column">
            <h4>Quick Links</h4>
            <a href="/shops">Shops</a>
            <a href="/services">Services</a>
            <a href="/community">Community</a>
            {/* <a href="/premium">Premium Services</a> */}
          </div>

          <div className="jp-footer-column">
            <h4>Support</h4>
            <a href="/about">About Us</a>
            <a href="/contact">Contact Us</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
          </div>

          <div className="jp-footer-column">
            <h4>Follow Us</h4>
            <div className="jp-socials">
              <a href="#facebook">f</a>
              <a href="#instagram">◎</a>
              <a href="#x">X</a>
              <a href="#linkedin">in</a>
              <a href="#youtube">▶</a>
            </div>
          </div>

          <div className="jp-footer-column jp-app-column">
            <h4>Download Our App</h4>
            <a
              className="jp-google-play"
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>▶</span>
              <small>
                GET IT ON
                <strong>Google Play</strong>
              </small>
            </a>
          </div>
        </div>

        <div className="jp-footer-bottom">
          <span>
            © {new Date().getFullYear()} JusPing. All rights reserved.
          </span>
          <span>
            Made with <b>♥</b> for Local Communities
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardSummary;