import React, { useEffect, useState } from 'react';
import './Product.css';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { cart, cartLoaded, addToCart } = useCart();
  const navigate = useNavigate();

  // ✅ Fetch products with token
  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        navigate('/login'); // Redirect if not logged in
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
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

  // ✅ Sync quantities with cart
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

    setQuantities((prev) => ({
      ...prev,
      [product.id]: newQty,
    }));

    const cartQty = cart[product.id]?.quantity || 0;
    const diff = newQty - cartQty;
    if (diff !== 0) {
      addToCart(product, diff);
    }
  };

  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((acc, item) => acc + item.quantity * item.price, 0);

  if (!cartLoaded || products.length === 0) return <div>Loading...</div>;

  return (
    <section className="product-section">
      <h1>Search as per Choice</h1>
      <div className="product-grid">
        {products.map((product) => (
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
                onClick={() => handleQtyChange(product, -1)}
                disabled={(quantities[product.id] || 0) <= 0}
              >-</button>
              <span>{quantities[product.id] || 0}</span>
              <button onClick={() => handleQtyChange(product, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="floating-cart" onClick={() => navigate('/order')}>
          🛒 {totalItems} item{totalItems > 1 ? 's' : ''} | ₹{totalPrice.toFixed(2)} → View Cart
        </div>
      )}
    </section>
  );
};

export default Product;
