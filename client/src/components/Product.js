import React, { useEffect, useState } from 'react';
import './Product.css';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import AddressPopup from './AddressPopup';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const CartImageCarousel = ({ imageList, resolveImageUrl, name }) => {
  const firstImage = imageList?.[0] || '';

  return (
    <div className="cart-image-carousel">
      <img
        src={resolveImageUrl(firstImage)}
        alt={name}
        className="cart-item-image"
      />
    </div>
  );
};

const Product = () => {
  const [isVendor, setIsVendor] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [tempAddress, setTempAddress] = useState({
    name: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
  });
  const [shopId, setShopId] = useState(null);

  const { cart, cartLoaded, addToCart } = useCart();
  const { user, loadingUser } = useUser();
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  const getSafeShopSlug = (slug) => {
    if (!slug || slug === 'undefined' || slug === 'null') return null;
    return slug;
  };

  const safeShopSlug = getSafeShopSlug(shopSlug);

  const resolveImageUrl = (image) => {
    if (!image) return '';
    if (!image.startsWith('/') && !image.startsWith('http')) {
      image = `/uploads/${image}`;
    }
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/')) {
      return `${API_BASE_URL}${image}`;
    }
    if (image.startsWith('/images/')) {
      return image;
    }
    return image;
  };

  const parseImageList = (image) => {
    if (!image) return [];
    try {
      const parsed = JSON.parse(image);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (err) {
      try {
        const cleanImage = image.trim().replace(/^["']|["']$/g, '');
        const parsedAgain = JSON.parse(cleanImage);
        if (Array.isArray(parsedAgain)) return parsedAgain;
        return [parsedAgain];
      } catch {
        return [image];
      }
    }
  };

  // decode HTML entities
  function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  // Check vendor status
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsVendor(decoded.role === 'vendor');
      } catch (err) {
        console.error('Invalid token:', err);
        setIsVendor(false);
      }
    } else {
      setIsVendor(false);
    }
  }, []);

  useEffect(() => {
    if (!safeShopSlug) {
      alert('Invalid shop URL.');
      navigate('/');
    }
  }, [safeShopSlug, navigate]);

  // Fetch shop info
  useEffect(() => {
    const fetchShopInfo = async () => {
      if (!safeShopSlug) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/shops/${safeShopSlug}`);
        if (!response.ok) {
          alert('Shop not found');
          navigate('/');
          return;
        }
        const shop = await response.json();
        setShopId(shop.id);
      } catch (error) {
        console.error('Error fetching shop info:', error);
        navigate('/');
      }
    };
    fetchShopInfo();
  }, [safeShopSlug, navigate]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!shopId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/products?shopId=${shopId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, [shopId]);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !user?.id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/address`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAddresses(data);
          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
            setTempAddress(data);
          } else {
            setSelectedAddressId(null);
            setTempAddress({ name: '', street: '', city: '', zip: '', phone: '' });
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    if (user?.id) {
      fetchAddresses();
    }
  }, [user]);

  const handleAddressSubmit = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to save address.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tempAddress),
      });
      if (!response.ok) throw new Error('Failed to save address');
      const savedAddress = await response.json();

      const updatedRes = await fetch(`${API_BASE_URL}/api/address`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (updatedRes.ok) {
        const updatedAddresses = await updatedRes.json();
        setAddresses(updatedAddresses);
        setSelectedAddressId(savedAddress.id);
        setTempAddress(savedAddress);
      }
      setShowAddressPopup(false);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('There was an error saving your address. Please try again.');
    }
  };

  const handleAddressSelect = (e) => {
    const id = Number(e.target.value);
    setSelectedAddressId(id);
    const addr = addresses.find((a) => a.id === id);
    if (addr) setTempAddress(addr);
  };

  useEffect(() => {
    if (!cartLoaded) return;
    const initialQuantities = {};
    Object.values(cart).forEach((item) => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [cart, cartLoaded]);

  const groupedProductsMap = products.reduce((acc, product) => {
    const category = product.category_name || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  const groupedProducts = Object.entries(groupedProductsMap)
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category));

  if (products.length === 0) {
    return <div className="loading">Loading fresh picks...</div>;
  }

  return (
    <section className="product-section">
      {/* user welcome + address */}
      {!loadingUser && user && (
        <div className="user-profile-banner">
          <span role="img" aria-label="user" className="user-icon">👤</span>
          <div className="user-info-container">
            <p>Welcome back, <strong>{user.name || user.email?.split('@')[0]}</strong></p>
            {addresses.length > 0 ? (
              <p className="user-address-banner">
                <strong>Delivering to:</strong>{' '}
                <select value={selectedAddressId || ''} onChange={handleAddressSelect} className="address-select">
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name}, {addr.street}, {addr.city} - {addr.zip} (📞 {addr.phone})
                    </option>
                  ))}
                </select>
                <br />
                <button onClick={() => setShowAddressPopup(true)} className="edit-btn">✏️ Edit Address</button>
              </p>
            ) : (
              <button
                onClick={() => {
                  setTempAddress({ name: '', street: '', city: '', zip: '', phone: '' });
                  setSelectedAddressId(null);
                  setShowAddressPopup(true);
                }}
                className="edit-btn"
              >➕ Add Address</button>
            )}
          </div>
        </div>
      )}

      <h1 className="page-title">Explore Fresh Picks</h1>

      {groupedProducts.map(({ category, items }, index) =>
        items.length > 0 ? (
          <div key={category} className={`category-section ${index % 2 === 0 ? 'light-bg' : 'dark-bg'}`}>
            <h2 className="category-title diamond-bg">{category}</h2>
            <div className="product-grid">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantities={quantities}
                  setQuantities={setQuantities}
                  cart={cart}
                  addToCart={addToCart}
                  resolveImageUrl={resolveImageUrl}
                  isVendor={isVendor}
                  safeShopSlug={safeShopSlug}
                  parseImageList={parseImageList}
                />
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* floating cart */}
      {Object.keys(cart).length > 0 && (
        <div className="floating-cart" onClick={() => setShowCartPopup(true)}>
          🛒 {Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)} item(s) | ₹
          {Object.values(cart).reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)} → View Cart
        </div>
      )}

      {/* cart popup */}
      {showCartPopup && (
        <div className="cart-popup" onClick={() => setShowCartPopup(false)}>
          <div className="cart-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="cart-close-btn" onClick={() => setShowCartPopup(false)}>&times;</button>
            <h2>Your Cart</h2>
            <ul>
              {Object.values(cart).map((item) => (
                <li key={item.id} className="cart-item-list">
                  <CartImageCarousel imageList={parseImageList(item.image)} resolveImageUrl={resolveImageUrl} name={item.name} />
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    {/* {item.unit && <span className="unit-label"> ({item.unit.toUpperCase()})</span>} */}
                    {(item.size || item.color || item.unit) && (
  <span className="unit-label">
    {' ('}
    {[item.size, item.color, item.unit].filter(Boolean).join(', ')}
    {')'}
  </span>
)}

                    <span className="cart-item-quantity"> × {item.quantity}</span>
                  </div>
                  <span className="cart-item-price">₹{(item.quantity * item.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => navigate(`/${safeShopSlug}/order`)} className="login-btn">
              Proceed to Order
            </button>
          </div>
        </div>
      )}

      {showAddressPopup && (
        <AddressPopup
          tempAddress={tempAddress}
          setTempAddress={setTempAddress}
          onClose={() => setShowAddressPopup(false)}
          onSubmit={handleAddressSubmit}
        />
      )}
    </section>
  );
};

const ProductCard = ({
  product,
  quantities,
  setQuantities,
  cart,
  addToCart,
  resolveImageUrl,
  isVendor,
  safeShopSlug,
  parseImageList,
}) => {
  // const hasUnits = Array.isArray(product.units) && product.units.length > 0;
  // const [selectedUnit, setSelectedUnit] = useState(hasUnits ? product.units[0] : null);
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants[0] : null);



  // const uniqueKey = hasUnits ? `${product.id}-${selectedUnit?.unit_id}` : `${product.id}`;
  const uniqueKey = hasVariants
  ? `${product.id}-${selectedVariant?.size?.id || ''}-${selectedVariant?.color?.id || ''}-${selectedVariant?.unit?.id || ''}`
  : `${product.id}`;

  const qty = quantities[uniqueKey] || 0;

  const imageList = parseImageList(product.image);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleAdd = () => {
    // const price = selectedUnit?.price || product.price;
    // const item = { ...product, id: uniqueKey, unit: selectedUnit?.name, price };
    const price = selectedVariant?.price || product.price;
const item = {
  ...product,
  id: `${product.id}-${selectedVariant?.size?.id || ''}-${selectedVariant?.color?.id || ''}-${selectedVariant?.unit?.id || ''}`,
  unit: selectedVariant?.unit?.name,
  size: selectedVariant?.size?.name,
  color: selectedVariant?.color?.name,
  price
};

    addToCart(item, 1);
    setQuantities((prev) => ({ ...prev, [uniqueKey]: 1 }));
  };

  const handleQtyChange = (delta) => {
    const newQty = Math.max(0, qty + delta);
    // const price = selectedUnit?.price || product.price;
    // const item = { ...product, id: uniqueKey, unit: selectedUnit?.name, price };
    
    const price = selectedVariant?.price || product.price;
const item = {
  ...product,
  id: `${product.id}-${selectedVariant?.size?.id || ''}-${selectedVariant?.color?.id || ''}-${selectedVariant?.unit?.id || ''}`,
  unit: selectedVariant?.unit?.name,
  size: selectedVariant?.size?.name,
  color: selectedVariant?.color?.name,
  price
};

    if (delta !== 0) {
      addToCart(item, delta);
      setQuantities((prev) => ({ ...prev, [uniqueKey]: newQty }));
    }
  };

  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="image-container">
        <img
          src={resolveImageUrl(imageList[currentImageIndex])}
          alt={`${product.name}-${currentImageIndex + 1}`}
          className="product-image"
        />
        {/* Quantity controls overlay */}
        {qty > 0 ? (
          <div className="qty-controls-overlay">
            <button className="qty-btn" onClick={() => handleQtyChange(-1)} disabled={qty <= 0}>−</button>
            <span className="qty-number">{qty}</span>
            <button className="qty-btn" onClick={() => handleQtyChange(1)}>+</button>
          </div>
        ) : (
          <button className="add-btn-overlay" onClick={handleAdd}>Add</button>
        )}
      </div>

      {/* Moved Dots HERE (above product name) */}
      {imageList.length > 1 && (
        <div className="carousel-dots product-dots">
          {imageList.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
              onClick={() => setCurrentImageIndex(idx)}
            ></span>
          ))}
        </div>
      )}

      {/* Product Info */}
      <h3 className="product-name">{product.name}</h3>
      <p className="product-description">{product.description}</p>

      {/* Units Dropdown */}
      {/* {hasUnits && (
        <select
          value={selectedUnit?.unit_id}
          onChange={(e) => {
            const selected = product.units.find((unit) => unit.unit_id === Number(e.target.value));
            setSelectedUnit(selected);
          }}
          className="unit-select"
        >
          {product.units.map((unit) => (
            <option key={unit.unit_id} value={unit.unit_id}>
              {unit.name} ₹{unit.price}
            </option>
          ))}
        </select>
      )} */}
      {hasVariants && (
  <>
    {/* Size selector */}
    {product.variants.some(v => v.size) && (
      <select
        value={selectedVariant?.size?.id || ''}
        onChange={(e) => {
          const sizeId = Number(e.target.value);
          const matched = product.variants.find(
            (v) => v.size?.id === sizeId &&
                   (!selectedVariant?.color || v.color?.id === selectedVariant.color?.id) &&
                   (!selectedVariant?.unit || v.unit?.id === selectedVariant.unit?.id)
          );
          if (matched) setSelectedVariant(matched);
        }}
        className="variant-select"
      >
        {[...new Set(product.variants.map((v) => v.size?.id))]
          .filter(Boolean)
          .map((id) => {
            const name = product.variants.find((v) => v.size?.id === id)?.size?.name;
            return <option key={id} value={id}>{name}</option>;
          })}
      </select>
    )}

    {/* Color selector */}
    {product.variants.some(v => v.color) && (
      <select
        value={selectedVariant?.color?.id || ''}
        onChange={(e) => {
          const colorId = Number(e.target.value);
          const matched = product.variants.find(
            (v) => v.color?.id === colorId &&
                   (!selectedVariant?.size || v.size?.id === selectedVariant.size?.id) &&
                   (!selectedVariant?.unit || v.unit?.id === selectedVariant.unit?.id)
          );
          if (matched) setSelectedVariant(matched);
        }}
        className="variant-select"
      >
        {[...new Set(product.variants.map((v) => v.color?.id))]
          .filter(Boolean)
          .map((id) => {
            const name = product.variants.find((v) => v.color?.id === id)?.color?.name;
            return <option key={id} value={id}>{name}</option>;
          })}
      </select>
    )}

    {/* Unit selector */}
    {product.variants.some(v => v.unit) && (
      <select
        value={selectedVariant?.unit?.id || ''}
        onChange={(e) => {
          const unitId = Number(e.target.value);
          const matched = product.variants.find(
            (v) => v.unit?.id === unitId &&
                   (!selectedVariant?.size || v.size?.id === selectedVariant.size?.id) &&
                   (!selectedVariant?.color || v.color?.id === selectedVariant.color?.id)
          );
          if (matched) setSelectedVariant(matched);
        }}
        className="variant-select"
      >
        {/* {[...new Set(product.variants.map((v) => v.unit?.id))]
          .filter(Boolean)
          .map((id) => {
            const unit = product.variants.find((v) => v.unit?.id === id)?.unit;
            return <option key={id} value={id}>{unit?.name} ₹{unit?.price || 0}</option>;
          })} */}
          {[...new Set(product.variants.map((v) => v.unit?.id))]
  .filter(Boolean)
  .map((id) => {
    const foundVariant = product.variants.find((v) => v.unit?.id === id);
    const unit = foundVariant?.unit;
    const price = Number(foundVariant?.price) || 0;  // convert to number safely
    return (
      <option key={id} value={id}>
        {unit?.name} ₹{price.toFixed(2)}
      </option>
    );
  })}

      </select>
    )}
  </>
)}


      <div className="price-display">
        {/* ₹{((selectedUnit?.price || product.price) * (qty || 1)).toFixed(2)} */}
        ₹{((selectedVariant?.price || product.price) * (qty || 1)).toFixed(2)}

      </div>
    </div>
  );
};

export default Product;
