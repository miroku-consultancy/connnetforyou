import React, { useEffect, useState } from 'react';
import './Product.css';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { cart, cartLoaded, addToCart } = useCart();
  const navigate = useNavigate();

  const API_BASE_URL = 'https://connnet4you-server.onrender.com';

  const SUBCATEGORIES = [
    'Fresh Vegetables',
    'Mangoes & Melons',
    'Fresh Fruits',
    'Exotics & Premium',
    'Leafy, Herbs & Seasonings',
    'Organics & Hydroponics',
    'Plants & Gardening',
    'Flowers & Leaves',
    'Cuts & Sprouts',
    'Dried & Dehydrated',
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            navigate('/login');
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

    fetchProducts();
  }, [navigate]);

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

  const freshProducts = products.filter(p => p.category?.toLowerCase() === 'fresh');

  const groupedProducts = SUBCATEGORIES.map((subcategory) => ({
    subcategory,
    items: freshProducts.filter(p => p.subcategory === subcategory),
  }));

  if (!cartLoaded || products.length === 0) return <div className="loading">Loading fresh picks...</div>;

  return (
    <section className="product-section">
      <h1 className="page-title">Explore Fresh Picks 🥬</h1>

      {groupedProducts.map(({ subcategory, items }, index) => (
        items.length > 0 && (
          <div key={subcategory} className={`subcategory-section ${index % 2 === 0 ? 'light-bg' : 'dark-bg'}`}>
            <h2 className="subcategory-title">{subcategory}</h2>
            <div className="product-grid">
              {items.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={process.env.PUBLIC_URL + product.image}
                    alt={product.name}
                    className="product-image"
                  />
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">₹{product.price}</p>
                  <div className="qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => handleQtyChange(product, -1)}
                      disabled={(quantities[product.id] || 0) <= 0}
                    >−</button>
                    <span className="qty-number">{quantities[product.id] || 0}</span>
                    <button className="qty-btn" onClick={() => handleQtyChange(product, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {Object.keys(cart).length > 0 && (
        <div className="floating-cart" onClick={() => navigate('/order')}>
          🛒 {Object.values(cart).reduce((a, i) => a + i.quantity, 0)} item(s) | ₹{Object.values(cart).reduce((a, i) => a + i.quantity * i.price, 0).toFixed(2)} → View Cart
        </div>
      )}
    </section>
  );
};

export default Product;
