/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  // Generate or get device ID for cart identification
  useEffect(() => {
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = "device_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("deviceId", storedDeviceId);
    }
    setTimeout(() => setDeviceId(storedDeviceId), 0);
  }, []);

  // Load cart from database on component mount
  useEffect(() => {
    if (!deviceId) return;

    const cartRef = doc(db, "carts", deviceId);
    
    const unsubscribe = onSnapshot(cartRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const cartData = docSnapshot.data().items || [];
        setCart(cartData);
      } else {
        setCart([]);
      }
    }, (error) => {
      console.error("Error loading cart:", error);
      setCart([]);
    });

    return () => unsubscribe();
  }, [deviceId]);

  // Save cart to database whenever it changes
  const saveCartToDatabase = async (updatedCart) => {
    if (!deviceId) return;
    
    try {
      const cartRef = doc(db, "carts", deviceId);
      await setDoc(cartRef, {
        items: updatedCart,
        lastUpdated: new Date().toISOString(),
        deviceId: deviceId
      });
    } catch (error) {
      console.error("Error saving cart to database:", error);
    }
  };

  // ➕ Add product or increase quantity
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      let updatedCart;
      if (existing) {
        updatedCart = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...prev, { ...product, quantity: 1 }];
      }

      // Save to database
      saveCartToDatabase(updatedCart);
      return updatedCart;
    });
  };

  // ➖ Decrease quantity
  const decreaseQuantity = (id) => {
    setCart((prev) => {
      const updatedCart = prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0); // remove if 0

      // Save to database
      saveCartToDatabase(updatedCart);
      return updatedCart;
    });
  };

  // ❌ Remove item completely
  const removeItem = (id) => {
    setCart((prev) => {
      const updatedCart = prev.filter((item) => item.id !== id);
      
      // Save to database
      saveCartToDatabase(updatedCart);
      return updatedCart;
    });
  };

  // Clear cart completely
  const clearCart = () => {
    setCart([]);
    saveCartToDatabase([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, decreaseQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
