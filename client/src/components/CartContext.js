import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, userId, shopSlug }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);

  // Unique cart key
  const getCartKey = () => {
    return userId && shopSlug ? `cart_${userId}_${shopSlug}` : null;
  };

  // Load cart on mount or when user/shop changes
  useEffect(() => {
    const key = getCartKey();
    if (!key) {
      setCart({});
      setCartLoaded(true);
      return;
    }

    try {
      const savedCart = localStorage.getItem(key);
      setCart(savedCart ? JSON.parse(savedCart) : {});
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart({});
    }

    setCartLoaded(true);
  }, [userId, shopSlug]);

  // Persist cart
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

  // Add or update item
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

  // Change quantity
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

  // Clear current cart
  const clearCart = () => {
    const key = getCartKey();
    if (key) localStorage.removeItem(key);
    setCart({});
  };

  // ✅ Clear all carts across all shops
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
        clearAllCarts, // ✅ export this
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
