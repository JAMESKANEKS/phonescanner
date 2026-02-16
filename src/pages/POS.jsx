import { useContext, useState } from "react";
import Scanner from "../components/Scanner";
import Cart from "../components/Cart";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const { cart, setCart, addToCart } = useContext(CartContext); 
  const navigate = useNavigate();
  const [manualBarcode, setManualBarcode] = useState("");

  // ✅ Add product manually by barcode
  const handleAddManualBarcode = async () => {
    if (!manualBarcode) return alert("Enter a barcode!");

    try {
      const q = query(collection(db, "products"), where("barcode", "==", manualBarcode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return alert("Product not found!");
      }

      const productData = snapshot.docs[0].data();
      const product = {
        id: snapshot.docs[0].id,
        name: productData.name,
        price: productData.price,
      };

      addToCart(product); // add to cart context
      setManualBarcode(""); // clear input
    } catch (err) {
      console.error("Error fetching product:", err);
      alert("Failed to fetch product");
    }
  };

  // ✅ Sold Now button
  const handleSoldNow = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const saleData = {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total,
        date: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "sales"), saleData);

      setCart([]);
      navigate(`/receipt/${docRef.id}`);
    } catch (err) {
      console.error("Error saving sale:", err);
      alert("Failed to save sale. Check console for error.");
    }
  };

  return (
    <div>
      <h1>POS System</h1>

      {/* Manual Barcode Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter barcode manually"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          style={{ padding: "5px", width: "200px" }}
        />
        <button
          onClick={handleAddManualBarcode}
          style={{ padding: "5px 10px", marginLeft: "10px" }}
        >
          Add Product
        </button>
      </div>

      {/* Scanner Component */}
      <Scanner />

      {/* Cart Component */}
      <Cart />

      {/* Sold Now Button */}
      <button
        onClick={handleSoldNow}
        style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
      >
        Sold Now
      </button>
    </div>
  );
}
