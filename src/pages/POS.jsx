import { useContext, useState } from "react";
import Scanner from "../components/Scanner";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const { cart, addToCart } = useContext(CartContext); 
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

      const productDoc = snapshot.docs[0];
      const productData = productDoc.data();
      const currentStock = productData.stock || 0;

      // 🔍 CHECK STOCK AVAILABILITY
      if (currentStock <= 0) {
        alert(`⚠️ Product "${productData.name}" is out of stock!`);
        return;
      }

      const product = {
        id: productDoc.id,
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
      <div style={{ marginTop: "20px" }}>
        <p>Items in cart: {cart.length}</p>
        <button
          onClick={() => navigate("/cart")}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          View Cart
        </button>
      </div>
    </div>
  );
}
