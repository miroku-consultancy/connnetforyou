import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
    }
    setCartLoaded(true);
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  // Add product with quantity delta (can be negative)
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const newQty = (existing?.quantity || 0) + quantity;

      if (newQty <= 0) {
        // Remove product if quantity <= 0
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

  // Update quantity by delta for product ID
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

  // Remove all items from cart
  const clearCart = () => {
    setCart({});
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{ cart, cartLoaded, addToCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
