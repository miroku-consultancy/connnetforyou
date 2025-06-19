import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Custom hook to access cart context
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from localStorage on initial mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart from localStorage', e);
      }
    }
    setCartLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart or update quantity
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const updatedQty = (existing?.quantity || 0) + quantity;

      if (updatedQty <= 0) {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: updatedQty,
        },
      };
    });
  };

  // Update quantity by delta (used for +/- buttons)
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

  // Clear the cart completely
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
