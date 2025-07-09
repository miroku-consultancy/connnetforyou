import React, { useEffect, useState } from 'react';
import './Product.css';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import AddressPopup from './AddressPopup';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

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
    if (image.startsWith('http') || image.startsWith('/images/')) return image;
    return `${API_BASE_URL}/images/${image}`;
  };

  // Check vendor status if token exists (no redirect)
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

  // Redirect if invalid shopSlug
  useEffect(() => {
    if (!safeShopSlug) {
      alert('Invalid shop URL.');
      navigate('/');
    }
  }, [safeShopSlug, navigate]);

  // Fetch shop info without token
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

  // Fetch products without token
  useEffect(() => {
    const fetchProducts = async () => {
      if (!shopId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/products?shopId=${shopId}`);
        console.log(response,'response')

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        console.log('data',data)
        setProducts(data);
        console.log('Bound products to state:', data);

      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [shopId]);

  // Fetch addresses only if user & token present
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
            setTempAddress(data[0]);
          } else {
            setSelectedAddressId(null);
            setTempAddress({
              name: '',
              street: '',
              city: '',
              zip: '',
              phone: '',
            });
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

  const handleQtyChange = (product, delta) => {
    const prevQty = quantities[product.id] || 0;
    const newQty = Math.max(0, prevQty + delta);
    setQuantities((prev) => ({ ...prev, [product.id]: newQty }));

    const cartQty = cart[product.id]?.quantity || 0;
    const diff = newQty - cartQty;
    if (diff !== 0) addToCart(product, diff);
  };

  const freshProducts = products;
const groupedProductsMap = freshProducts.reduce((acc, product) => {
  const sub = product.subcategory || 'Uncategorized';
  if (!acc[sub]) acc[sub] = [];
  acc[sub].push(product);
  return acc;
}, {});

  const groupedProducts = Object.entries(groupedProductsMap)
    .map(([subcategory, items]) => ({ subcategory, items }))
    .sort((a, b) => a.subcategory.localeCompare(b.subcategory));

  if (products.length === 0) {
    return <div className="loading">Loading fresh picks...</div>;
  }

  return (
    <section className="product-section">
      {!loadingUser && user && (
        <div className="user-profile-banner">
          <span role="img" aria-label="user" className="user-icon">👤</span>
          <div className="user-info-container">
            <p>
              Welcome back, <strong>{user.name || user.email?.split('@')[0]}</strong>
            </p>

            {addresses.length > 0 ? (
              <p className="user-address-banner">
                <strong>Delivering to:</strong>{' '}
                <select
                  value={selectedAddressId || ''}
                  onChange={handleAddressSelect}
                  className="address-select"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name}, {addr.street}, {addr.city} - {addr.zip} (📞 {addr.phone})
                    </option>
                  ))}
                </select>
                <br />
                <button
                  onClick={() => setShowAddressPopup(true)}
                  className="edit-btn"
                >
                  ✏️ Edit Address
                </button>
              </p>
            ) : (
              <button
                onClick={() => {
                  setTempAddress({
                    name: '',
                    street: '',
                    city: '',
                    zip: '',
                    phone: '',
                  });
                  setSelectedAddressId(null);
                  setShowAddressPopup(true);
                }}
                className="edit-btn"
              >
                ➕ Add Address
              </button>
            )}
          </div>
        </div>
      )}

      <h1 className="page-title">Explore Fresh Picks</h1>

      {groupedProducts.map(({ subcategory, items }, index) =>
        items.length > 0 ? (
          <div
            key={subcategory}
            className={`subcategory-section ${index % 2 === 0 ? 'light-bg' : 'dark-bg'}`}
          >
            <h2 className="subcategory-title">{subcategory}</h2>
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
                />
              ))}
            </div>
          </div>
        ) : null
      )}

      {Object.keys(cart).length > 0 && (
        <div className="floating-cart" onClick={() => setShowCartPopup(true)}>
          🛒{' '}
          {Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)} item(s)
          | ₹
          {Object.values(cart)
            .reduce((sum, item) => sum + item.quantity * item.price, 0)
            .toFixed(2)}{' '}
          → View Cart
        </div>
      )}

      {showCartPopup && (
        <div className="cart-popup" onClick={() => setShowCartPopup(false)}>
          <div className="cart-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="cart-close-btn" onClick={() => setShowCartPopup(false)}>
              &times;
            </button>
            <h2>Your Cart</h2>
            <ul>
              {Object.values(cart).map((item) => (
                <li key={item.id}>
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  {item.name} × {item.quantity} = ₹{item.quantity * item.price}
                </li>
              ))}
            </ul>
            <button
  onClick={() => {
    if (!user) {
       navigate(`/${safeShopSlug}/order`);
      // User not logged in, navigate to login page
      //navigate('/login');
    } else {
      // User logged in, go to order page
      navigate(`/${safeShopSlug}/order`);
    }
  }}
  className="login-btn"
>
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
}) => {
  const hasUnits = Array.isArray(product.units) && product.units.length > 0;
  const [selectedUnit, setSelectedUnit] = useState(hasUnits ? product.units[0] : null);
  const uniqueKey = hasUnits ? `${product.id}-${selectedUnit?.unit_id}` : product.id;
  const qty = quantities[uniqueKey] || 0;
  const navigate = useNavigate();

  useEffect(() => {
    // Sync quantity for product/unit combo
    if (qty === 0 && cart[uniqueKey]) {
      // Remove from cart if quantity zero
      // (assuming addToCart with negative qty or separate remove method)
    }
  }, [qty, cart, uniqueKey]);

  const handleQtyChange = (delta) => {
    const newQty = Math.max(0, qty + delta);
    setQuantities((prev) => ({ ...prev, [uniqueKey]: newQty }));
    addToCart(
      {
        ...product,
        id: uniqueKey,
        unit: selectedUnit?.unit,
        price: selectedUnit?.price || product.price,
      },
      delta
    );
  };

  return (
    <div className="product-card">
      <img
        src={resolveImageUrl(product.image)}
        alt={product.name}
        className="product-image"
      />
      <h3 className="product-name">{product.name}</h3>

      {hasUnits && (
        <select
          value={selectedUnit?.unit_id}
          onChange={(e) => {
            const selected = product.units.find(
              (unit) => unit.unit_id === Number(e.target.value)
            );
            setSelectedUnit(selected);
          }}
          className="unit-select"
        >
          {product.units.map((unit) => (
            <option key={unit.unit_id} value={unit.unit_id}>
              {unit.unit} @ ₹{unit.price}
            </option>
          ))}
        </select>
      )}

      <div className="quantity-controls">
        <button onClick={() => handleQtyChange(-1)} disabled={qty <= 0}>
          -
        </button>
        <span className="quantity">{qty}</span>
        <button onClick={() => handleQtyChange(1)}>+</button>
      </div>

      <div className="price-display">
        ₹{(selectedUnit?.price || product.price) * qty || 0}
      </div>

     
    </div>
  );
};

export default Product;
