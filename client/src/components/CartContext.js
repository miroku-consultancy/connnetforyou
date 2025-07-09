import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, userId, shopSlug }) => {
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const lastKey = useRef(null);

  const getCartKey = (uid = userId) => {
    return shopSlug ? `cart_${uid || 'guest'}_${shopSlug}` : null;
  };

  // Load cart when userId or shopSlug changes
  useEffect(() => {
    const currentKey = getCartKey();
    if (!currentKey || currentKey === lastKey.current) return;

    const guestKey = getCartKey(null); // cart_guest_shopSlug
    const newCart = (() => {
      try {
        const userCart = localStorage.getItem(currentKey);
        const guestCart = localStorage.getItem(guestKey);

        if (userId && guestCart) {
          // Merge guest cart into user cart
          const parsedGuest = JSON.parse(guestCart);
          const parsedUser = userCart ? JSON.parse(userCart) : {};

          const merged = { ...parsedUser };
          for (const [id, item] of Object.entries(parsedGuest)) {
            if (merged[id]) {
              merged[id].quantity += item.quantity;
            } else {
              merged[id] = item;
            }
          }

          // Save merged cart to user key
          localStorage.setItem(currentKey, JSON.stringify(merged));
          localStorage.removeItem(guestKey);
          return merged;
        }

        return userCart ? JSON.parse(userCart) : guestCart ? JSON.parse(guestCart) : {};
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return {};
      }
    })();

    setCart(newCart);
    lastKey.current = currentKey;
    setCartLoaded(true);
  }, [userId, shopSlug]);

  // Save cart whenever it changes
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
