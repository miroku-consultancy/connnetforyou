import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, userId, shopSlug }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);

  // Unique key based on userId and shopSlug
  const getCartKey = () => {
    return userId && shopSlug ? `cart_${userId}_${shopSlug}` : null;
  };

  // Load cart from localStorage when userId/shopSlug changes
  useEffect(() => {
    const key = getCartKey();
    if (!key) {
      setCart({});
      setCartLoaded(true);
      return;
    }

    try {
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart({});
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart({});
    }

    setCartLoaded(true);
  }, [userId, shopSlug]);

  // Save cart to localStorage on change
  useEffect(() => {
    const key = getCartKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, userId, shopSlug]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const newQty = (existing?.quantity || 0) + quantity;

      if (newQty <= 0) {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: newQty,
        },
      };
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [productId]: { ...item, quantity: newQty },
      };
    });
  };

  const clearCart = () => {
    const key = getCartKey();
    if (key) {
      localStorage.removeItem(key);
    }
    setCart({});
  };

  return (
    <CartContext.Provider value={{ cart, cartLoaded, addToCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
