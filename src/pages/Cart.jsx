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
      setTimeout(() => setChange(cashNum - grandTotal), 0);
    } else {
      setTimeout(() => setChange(0), 0);
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
      if (err.code === 'permission-denied') {
        alert("Permission denied: You don't have access to complete sales.");
      } else if (err.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (err.code === 'resource-exhausts') {
        alert("Quota exceeded: Please try again later.");
      } else {
        alert("Error completing sale: " + err.message);
      }
    }
  };

  return (
    <div>
      <h1 className="pos-page-title">Checkout</h1>

      {loading ? (
        <p className="pos-muted">Loading carts...</p>
      ) : (
        <div className="pos-layout-row">
          {/* Items list */}
          <div style={{ flex: "1 1 420px" }}>
            <div className="pos-card">
              <div className="pos-card-header">
                <span>Cart items</span>
              </div>

              {allCarts.every((c) => !c.items || c.items.length === 0) ? (
                <p className="pos-muted">No items in any cart.</p>
              ) : (
                allCarts.map((cartData) =>
                  cartData.items && cartData.items.length > 0
                    ? cartData.items.map((item, index) => (
                        <div
                          key={`${cartData.id}-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                            borderBottom:
                              "1px solid rgba(56, 64, 90, 0.7)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {item.name}
                            </div>
                            <div className="pos-muted">
                              ₱{item.price} each
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div className="pos-chip">
                              ₱{item.price * item.quantity}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <button
                                className="pos-button-secondary"
                                onClick={() =>
                                  decreaseQuantity(cartData.id, item.id)
                                }
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                className="pos-button-secondary"
                                onClick={() =>
                                  increaseQuantity(cartData.id, item.id)
                                }
                              >
                                +
                              </button>
                              <button
                                className="pos-button-danger"
                                onClick={() =>
                                  removeProduct(cartData.id, item.id)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    : null
                )
              )}
            </div>
          </div>

          {/* Totals + payment */}
          <div style={{ flex: "0 0 280px" }}>
            <div className="pos-card">
              <div className="pos-card-header">
                <span>Payment</span>
              </div>

              <div className="pos-total-row">
                Grand Total: ₱{grandTotal.toFixed(2)}
              </div>

              <div className="pos-mt-md">
                <div className="pos-label">Cash received</div>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="pos-input"
                />
                <div className="pos-mt-md pos-text-right">
                  <span className="pos-muted">
                    Change: ₱{change < 0 ? 0 : change.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pos-mt-lg pos-text-right">
                <button
                  className="pos-button-danger"
                  onClick={handleSellCart}
                >
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
