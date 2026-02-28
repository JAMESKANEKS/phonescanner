/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import { getUserCart, addUserCartItem, updateUserCartItem, deleteUserCartItem, clearUserCart } from "../services/dataService";

export const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user cart from database
  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setLoading(false);
      return;
    }

    const loadUserCart = async () => {
      try {
        setLoading(true);
        const cartItems = await getUserCart(currentUser.uid);
        setCart(cartItems);
      } catch (error) {
        console.error("Error loading user cart:", error);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserCart();
  }, [currentUser]);

  // ➕ Add product or increase quantity
  const addToCart = async (product) => {
    if (!currentUser) return;
    
    try {
      // Check if product already exists in cart by matching product.id (original product ID)
      const existing = cart.find((item) => item.productId === product.id);
      
      if (existing) {
        // Update existing item
        const updatedItem = { ...existing, quantity: existing.quantity + 1 };
        await updateUserCartItem(currentUser.uid, existing.id, updatedItem);
        setCart(prev => prev.map(item => 
          item.productId === product.id ? updatedItem : item
        ));
      } else {
        // Add new item with both original product ID and cart item ID
        const cartItemData = { 
          ...product, 
          quantity: 1,
          productId: product.id // Store original product ID for reference
        };
        const cartItemId = await addUserCartItem(currentUser.uid, cartItemData);
        setCart(prev => [...prev, { ...cartItemData, id: cartItemId }]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // ➖ Decrease quantity
  const decreaseQuantity = async (id) => {
    if (!currentUser) return;
    
    try {
      const item = cart.find(item => item.id === id);
      if (!item) return;
      
      if (item.quantity > 1) {
        // Update quantity
        const updatedItem = { ...item, quantity: item.quantity - 1 };
        await updateUserCartItem(currentUser.uid, id, updatedItem);
        setCart(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
      } else {
        // Remove item
        await deleteUserCartItem(currentUser.uid, id);
        setCart(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
    }
  };

  // ❌ Remove item completely
  const removeItem = async (id) => {
    if (!currentUser) return;
    
    try {
      await deleteUserCartItem(currentUser.uid, id);
      setCart(prev => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing item:', error);
      // Optionally show user feedback
    }
  };

  // Clear cart completely
  const clearCart = async () => {
    if (!currentUser) return;
    
    try {
      await clearUserCart(currentUser.uid);
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Optionally show user feedback
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, decreaseQuantity, removeItem, clearCart, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}
