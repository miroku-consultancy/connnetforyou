import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, userId, shopSlug }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const lastKey = useRef(null);

  const getCartKey = () => {
    return userId && shopSlug ? `cart_${userId}_${shopSlug}` : null;
  };

  // Load cart whenever userId or shopSlug changes
  useEffect(() => {
    const key = getCartKey();
    if (!key || key === lastKey.current) return;

    try {
      const savedCart = localStorage.getItem(key);
      setCart(savedCart ? JSON.parse(savedCart) : {});
      lastKey.current = key;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart({});
    }

    setCartLoaded(true);
  }, [userId, shopSlug]);

  // Save cart when it changes
  useEffect(() => {
    const key = getCartKey();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
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
    if (key) localStorage.removeItem(key);
    setCart({});
  };

  const clearAllCarts = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('cart_')) {
        localStorage.removeItem(key);
      }
    });
    setCart({});
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoaded,
        addToCart,
        updateQuantity,
        clearCart,
        clearAllCarts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
