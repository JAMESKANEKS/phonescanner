import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Add product to cart
  const addToCart = (product) => {
    setCart((prev) => {
      // Check if product already exists in cart
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        // Increase quantity
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        // Add new product with quantity 1
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
  <CartContext.Provider value={{ cart, addToCart, removeFromCart, setCart }}>
    {children}
  </CartContext.Provider>
);
}
