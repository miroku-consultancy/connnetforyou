

import React, { useEffect, useState } from "react";

import "./DashboardSummary.css";

import { useNavigate } from "react-router-dom";

import { useCart } from "./CartContext";

import { useUser } from "./UserContext";



const API_BASE_URL = "https://connnet4you-server.onrender.com";

const IMAGE_BASE_URL = "https://www.jusping.com/images/shops";



const PLAY_STORE_URL =

  "https://play.google.com/store/apps/details?id=com.connectfree4u.connectfree4u";



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



const DashboardSummary = () => {

  const navigate = useNavigate();



  const [shops, setShops] = useState([]);

  const [search, setSearch] = useState("");

  const [visitCount, setVisitCount] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showAll, setShowAll] = useState(false);

  const [locationError, setLocationError] = useState(false);



  const { clearAllCarts } = useCart();

  const { setUser } = useUser();



  // Visit analytics

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



  // Fetch nearby shops

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



  // Navigate to the selected shop
const handleClick = (slug) => {
  if (!slug) return;

  if (slug.toLowerCase() === "city-home-services") {
    window.location.href =
      "https://city-home-services.jusping.com/services";
    return;
  }

  window.location.href =
    `https://${slug}.jusping.com/products`;
};



  // Shop image with fallback

  const getImageElement = (shop) => {

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



            img.src =

              `${IMAGE_BASE_URL}/${shop.slug}.${extensions[attempt + 1]}`;

          } else {

            img.onerror = null;

            img.src = `${IMAGE_BASE_URL}/logo.png`;

          }

        }}

      />

    );

  };



  // Fallback shop list

  const fallbackShops = Object.keys(shopIcons).map((slug) => ({

    slug,

  }));



  const list = shops.length > 0 ? shops : fallbackShops;



  // Search shops

  const filteredShops = list.filter((shop) => {

    const query = search.toLowerCase().trim();



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



  const visibleShops = showAll

    ? filteredShops

    : filteredShops.slice(0, 8);



  if (loading) {

    return (

      <div className="jp-loading">

        <div className="jp-loading-logo">J</div>

        <p>Discovering nearby stores...</p>

      </div>

    );

  }



  return (

    <div className="jp-dashboard">



      {/* Header */}

      <header className="jp-header">

        <div className="jp-brand">

          <div className="jp-brand-icon">J</div>

          <span className="jp-brand-name">JusPing</span>

        </div>



        <a

          href={PLAY_STORE_URL}

          target="_blank"

          rel="noopener noreferrer"

          className="jp-app-link"

        >

          Get App <span>↗</span>

        </a>

      </header>



      {/* Hero */}

      <section className="jp-hero">

        <div className="jp-hero-content">

          <span className="jp-eyebrow">

            LOCAL STORES. REAL CONNECTIONS.

          </span>



          <h1>

            Your neighbourhood,

            <br />

            <span>all in one place.</span>

          </h1>



          <p>

            Discover local shops, explore products,

            and connect with the people behind them.

          </p>



          <div className="jp-search">

            <span className="jp-search-icon">⌕</span>



            <input

              type="search"

              value={search}

              placeholder="Search shops or products..."

              onChange={(event) => {

                setSearch(event.target.value);

                setShowAll(false);

              }}

              aria-label="Search shops"

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



          <div className="jp-hero-note">

            <span className="jp-live-dot" />

            Discover shops around you

          </div>



          {visitCount !== null && (

            <div className="jp-visit-count">

              {visitCount.toLocaleString()} visits

            </div>

          )}

        </div>



        <div className="jp-hero-decoration">

          <div className="jp-circle jp-circle-one" />

          <div className="jp-circle jp-circle-two" />



          <div className="jp-hero-symbol">

            <span>J</span>

            <small>LOCAL & CONNECTED</small>

          </div>

        </div>

      </section>



      {/* Shops */}

      <section className="jp-stores">



        <div className="jp-section-header">

          <div>

            <span className="jp-section-kicker">

              MADE FOR YOUR NEIGHBOURHOOD

            </span>



            <h2>

              {search

                ? "Search results"

                : "Explore local stores"}

            </h2>



            <p>

              {search

                ? `${filteredShops.length} stores found`

                : locationError

                ? "Explore stores on JusPing."

                : "Find something you love, just around the corner."}

            </p>

          </div>



          {!search && filteredShops.length > 8 && (

            <button

              className="jp-view-all"

              onClick={() => setShowAll(!showAll)}

            >

              {showAll ? "Show less ↑" : "View all →"}

            </button>

          )}

        </div>



        {visibleShops.length > 0 ? (

          <div className="jp-shop-grid">

            {visibleShops.map((shop) => (

              <article

                key={shop.slug}

                className="jp-shop-card"

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

                  {getImageElement(shop)}



                  <span className="jp-shop-open">

                    Visit <span>↗</span>

                  </span>

                </div>



                <div className="jp-shop-info">

                  <div className="jp-shop-title-row">

                    <h3>

                      {shop.name || displayName(shop.slug)}

                    </h3>



                    <span className="jp-shop-arrow">↗</span>

                  </div>



                  <p className="jp-shop-address">

                    {shop.address || "Discover this local store"}

                  </p>



                  <div className="jp-shop-footer">

                    <span className="jp-shop-category">

                      {shop.category || "Local store"}

                    </span>



                    <span className="jp-shop-status">

                      <span />

                      Explore

                    </span>

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



      </section>



      {/* App banner */}

      <section className="jp-app-banner">

        <div className="jp-app-banner-content">

          <span className="jp-section-kicker">

            YOUR LOCAL WORLD, IN YOUR POCKET

          </span>



          <h2>

            Everything local.

            <br />

            One simple app.

          </h2>



          <p>

            Discover stores, browse products, and connect

            directly with local businesses.

          </p>



          <a

            href={PLAY_STORE_URL}

            target="_blank"

            rel="noopener noreferrer"

            className="jp-download-btn"

          >

            Get JusPing on Android <span>↗</span>

          </a>

        </div>



        <div className="jp-banner-mark">

          J<span>.</span>

        </div>

      </section>



      {/* Footer */}

      <footer className="jp-footer">

        <div className="jp-footer-brand">

          <strong>JusPing</strong>

          <span>Bringing local closer.</span>

        </div>



        <span className="jp-copyright">

          © {new Date().getFullYear()} JusPing

        </span>

      </footer>



    </div>

  );

};



export default DashboardSummary;