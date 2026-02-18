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
  const [scannerActive, setScannerActive] = useState(false);

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
      if (err.code === 'permission-denied') {
        alert("Permission denied: You don't have access to products.");
      } else if (err.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (err.code === 'not-found') {
        alert("Product not found. It may have been deleted.");
      } else {
        alert("Error fetching product: " + err.message);
      }
    }
  };


  return (
    <div>
      <h1 className="pos-page-title">POS Terminal</h1>

      {/* Headless scanner logic – renders into #reader inside the frame */}
      <Scanner active={scannerActive} />

      <div className="pos-layout-row">
        {/* Left column: scanner + manual barcode */}
        <div style={{ flex: "1 1 340px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Scanner</span>
              <span className="pos-badge">
                {scannerActive ? "Live" : "Idle"}
              </span>
            </div>

            <div className="pos-scanner-frame">
              <div id="reader" className="pos-scanner-target" />
            </div>

            <div className="pos-mt-md pos-text-right">
              <button
                className={scannerActive ? "pos-button-secondary" : "pos-button"}
                onClick={() => setScannerActive((prev) => !prev)}
              >
                {scannerActive ? "Stop Scanner" : "Start Scanner"}
              </button>
            </div>

            <div className="pos-mt-md">
              <div className="pos-label">Manual barcode</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Type barcode here"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="pos-input"
                />
                <button className="pos-button" onClick={handleAddManualBarcode}>
                  Add
                </button>
              </div>
              <div className="pos-muted pos-mt-md">
                Use either the camera scanner or type the barcode to add items.
              </div>
            </div>
          </div>
        </div>

        {/* Right column: cart summary */}
        <div style={{ flex: "1 1 260px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Cart Overview</span>
              <span className="pos-chip">{cart.length} items</span>
            </div>

            <p className="pos-muted">
              Scan products to build your cart, then proceed to checkout.
            </p>

            <div className="pos-mt-lg pos-text-right">
              <button
                className="pos-button-secondary"
                onClick={() => navigate("/cart")}
              >
                Open Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
