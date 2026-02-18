import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function Cart() {
  const navigate = useNavigate();
  const [allCarts, setAllCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState(""); // 💵 Cash input
  const [change, setChange] = useState(0); // 💰 Change

  // 🔥 REALTIME LISTENER FOR ALL CARTS
  useEffect(() => {
    const cartsCollection = collection(db, "carts");

    const unsubscribe = onSnapshot(
      cartsCollection,
      (snapshot) => {
        const cartsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllCarts(cartsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to carts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ➕ INCREASE QUANTITY WITH STOCK VALIDATION
  const increaseQuantity = async (cartId, productId) => {
    const cartRef = doc(db, "carts", cartId);
    const cart = allCarts.find((c) => c.id === cartId);

    if (cart && cart.items) {
      const currentItem = cart.items.find((item) => item.id === productId);
      
      // 🔍 CHECK PRODUCT STOCK
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentStock = productData.stock || 0;
        const currentQuantity = currentItem ? currentItem.quantity : 0;
        
        if (currentQuantity >= currentStock) {
          alert("⚠️ Not enough stock available!");
          return;
        }
      }

      const updatedItems = cart.items.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );

      await updateDoc(cartRef, { items: updatedItems });
    }
  };

  // ➖ DECREASE QUANTITY
  const decreaseQuantity = async (cartId, productId) => {
    const cartRef = doc(db, "carts", cartId);
    const cart = allCarts.find((c) => c.id === cartId);

    if (cart && cart.items) {
      const updatedItems = cart.items
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);

      await updateDoc(cartRef, { items: updatedItems });
    }
  };

  // 🗑️ REMOVE PRODUCT COMPLETELY
  const removeProduct = async (cartId, productId) => {
    const cartRef = doc(db, "carts", cartId);
    const cart = allCarts.find((c) => c.id === cartId);

    if (cart && cart.items) {
      const updatedItems = cart.items.filter(
        (item) => item.id !== productId
      );

      await updateDoc(cartRef, { items: updatedItems });
    }
  };

  // 🧮 GRAND TOTAL
  const grandTotal = allCarts.reduce(
    (total, cart) =>
      total +
      (cart.items
        ? cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )
        : 0),
    0
  );

  // 💵 CALCULATE CHANGE
  useEffect(() => {
    const cashNum = parseFloat(cash);
    if (!isNaN(cashNum)) {
      setChange(cashNum - grandTotal);
    } else {
      setChange(0);
    }
  }, [cash, grandTotal]);

  // 💰 SELL ALL ITEMS WITH STOCK SUBTRACTION
  const handleSellCart = async () => {
    const cashNum = parseFloat(cash);
    if (!cash || cashNum < grandTotal) {
      alert("Cash is insufficient!");
      return;
    }

    const allItems = [];
    allCarts.forEach((cart) => {
      if (cart.items) allItems.push(...cart.items);
    });

    if (allItems.length === 0) {
      alert("Cart is empty!");
      return;
    }

    // 🔍 VALIDATE STOCK FOR ALL ITEMS
    for (const item of allItems) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentStock = productData.stock || 0;
        
        if (item.quantity > currentStock) {
          alert(`⚠️ Not enough stock for ${item.name}! Available: ${currentStock}, Required: ${item.quantity}`);
          return;
        }
      }
    }

    const saleData = {
      items: allItems,
      total: grandTotal,
      cash: cashNum,      // 💵 Save cash received
      change: change,     // 💰 Save change
      date: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "sales"), saleData);

      // 📦 SUBTRACT STOCK FOR EACH SOLD ITEM
      for (const item of allItems) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStock = productData.stock || 0;
          const newStock = currentStock - item.quantity;
          
          await updateDoc(productRef, { stock: newStock });
        }
      }

      // 🧹 CLEAR ALL CARTS
      for (const cart of allCarts) {
        await setDoc(doc(db, "carts", cart.id), { items: [] });
      }

      alert(`Sale completed! Change: ₱${change.toFixed(2)}`);
      navigate(`/receipt/${docRef.id}`);
    } catch (err) {
      console.error("Error completing sale:", err);
      alert("Failed to complete sale. Check console for details.");
    }
  };

  return (
    <div>
      <h1>All Shopping Carts</h1>

      {loading ? (
        <p>Loading carts...</p>
      ) : (
        <>
          {allCarts.map((cartData) =>
            cartData.items && cartData.items.length > 0
              ? cartData.items.map((item, index) => (
                  <div
                    key={`${cartData.id}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      alignItems: "center",
                    }}
                  >
                    {/* 🧾 PRODUCT INFO */}
                    <div>
                      <strong>{item.name}</strong> — ₱{item.price}
                    </div>

                    {/* 💰 PRICE */}
                    <div style={{ fontWeight: "bold", color: "#007bff" }}>
                      ₱{item.price * item.quantity}
                    </div>

                    {/* 🎛️ ACTION BUTTONS */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => decreaseQuantity(cartData.id, item.id)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQuantity(cartData.id, item.id)}>
                        +
                      </button>
                      <button
                        onClick={() => removeProduct(cartData.id, item.id)}
                        style={{ backgroundColor: "red", color: "white" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              : null
          )}

          {/* GRAND TOTAL */}
          <h2 style={{ textAlign: "right" }}>Grand Total: ₱{grandTotal}</h2>

          {/* 💵 CASH INPUT */}
          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <label>
              Cash: ₱
              <input
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                style={{ width: "120px", marginLeft: "10px" }}
              />
            </label>
            <p>Change: ₱{change < 0 ? 0 : change.toFixed(2)}</p>
          </div>

          {/* SELL BUTTON */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={handleSellCart}
              style={{
                padding: "15px 30px",
                fontSize: "18px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Sold All Items
            </button>
          </div>
        </>
      )}
    </div>
  );
}
