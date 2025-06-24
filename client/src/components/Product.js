import React, { useEffect, useState } from 'react';
import './Product.css';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import LogoutButton from './LogoutButton';
import AddressPopup from './AddressPopup';

const Product = () => {
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

  const { cart, cartLoaded, addToCart } = useCart();
  const { user, loadingUser } = useUser();
  const navigate = useNavigate();

  const API_BASE_URL = 'https://connnet4you-server.onrender.com';

  const SUBCATEGORIES = [
    'Fresh Fruits',
    'Mangoes & Melons',
    'Plants & Gardening',
    'Fresh Vegetables',
    'Exotics & Premium',
    'Leafy, Herbs & Seasonings',
    'Organics & Hydroponics',
    'Flowers & Leaves',
    'Cuts & Sprouts',
    'Dried & Dehydrated',
  ];

  const resolveImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http') || image.startsWith('/images/')) return image;
    return `https://connnet4you-server.onrender.com/images/${image}`;
  };

  useEffect(() => {
    console.log('USER:', user);

    const fetchProducts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      if (!user?.shopId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/products?shopId=${user.shopId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            navigate('/');
          } else {
            throw new Error('Failed to fetch products');
          }
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    if (user?.shopId) {
      fetchProducts();
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAddresses = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !user?.id) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/address`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  const freshProducts = products.filter(
    (p) => p.category?.toLowerCase() === 'fresh'
  );

  const groupedProducts = SUBCATEGORIES.map((subcategory) => ({
    subcategory,
    items: freshProducts.filter((p) => p.subcategory === subcategory),
  }));

  if (!cartLoaded || products.length === 0) {
    return <div className="loading">Loading fresh picks...</div>;
  }

  return (
    <section className="product-section">
      {!loadingUser && user && (
        <div className="user-profile-banner">
          <span role="img" aria-label="user" className="user-icon">
            👤
          </span>
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
                      {addr.name}, {addr.street}, {addr.city} - {addr.zip} (📞{' '}
                      {addr.phone})
                    </option>
                  ))}
                </select>
                <br />
                <button
                  onClick={() => setShowAddressPopup(true)}
                  className="edit-btn"
                  title="Edit Address"
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
                title="Add Address"
              >
                ➕ Add Address
              </button>
            )}
          </div>

          <div className="user-actions">
            <LogoutButton />
            <button
              onClick={() => navigate('/order-history')}
              className="order-history-btn"
              title="View your past orders"
            >
              📜 Order History
            </button>
            <button
              onClick={() => navigate('/admin/add-product')}
              className="add-product-btn"
              title="Add a new product"
              style={{ marginLeft: '10px' }}
            >
              ➕ Add Product
            </button>
          </div>
        </div>
      )}

      <h1 className="page-title">Explore Fresh Picks 🥬</h1>

      {groupedProducts.map(
        ({ subcategory, items }, index) =>
          items.length > 0 && (
            <div
              key={subcategory}
              className={`subcategory-section ${
                index % 2 === 0 ? 'light-bg' : 'dark-bg'
              }`}
            >
              <h2 className="subcategory-title">{subcategory}</h2>
              <div className="product-grid">
                {items.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="image-container">
                      <img
                        src={resolveImageUrl(product.image)}
                        alt={product.name}
                        className="product-image"
                      />
                      <div className="qty-controls-overlay">
                        <button
                          className="qty-btn"
                          onClick={() => handleQtyChange(product, -1)}
                          disabled={(quantities[product.id] || 0) <= 0}
                        >
                          −
                        </button>
                        <span className="qty-number">
                          {quantities[product.id] || 0}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => handleQtyChange(product, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <h3>{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <p className="product-price">₹{product.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )
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
        <div
          className="cart-popup"
          onClick={() => setShowCartPopup(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cart-popup-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="cart-close-btn"
              onClick={() => setShowCartPopup(false)}
              aria-label="Close Cart"
            >
              &times;
            </button>
            <h2>Your Cart</h2>
            <ul>
              {Object.values(cart).map((item) => (
                <li key={item.id} style={{ margin: '10px 0' }}>
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginRight: '10px',
                      verticalAlign: 'middle',
                    }}
                  />
                  {item.name} × {item.quantity} = ₹{item.quantity * item.price}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button onClick={() => navigate('/order')} className="login-btn">
                Proceed to Order
              </button>
            </div>
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

export default Product;
