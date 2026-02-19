import { useContext, useState } from "react";
import Scanner from "../components/Scanner";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const { cart, addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannerActive, setScannerActive] = useState(false);

  // ⭐ FUNCTION: ADD PRODUCT BY BARCODE (scanner or manual)
  const handleBarcodeScan = async (barcode) => {
    if (!barcode) return;

    try {
      const q = query(
        collection(db, "products"),
        where("barcode", "==", barcode)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("❌ Product not found!");
        return;
      }

      const productDoc = snapshot.docs[0];
      const data = productDoc.data();

      if ((data.stock || 0) <= 0) {
        alert(`⚠️ ${data.name} is out of stock!`);
        return;
      }

      const product = {
        id: productDoc.id,
        name: data.name,
        price: data.price
      };

      addToCart(product);
    } catch (err) {
      console.error(err);
      alert("Error fetching product");
    }
  };

  // ⭐ MANUAL INPUT ADD
  const handleAddManualBarcode = () => {
    handleBarcodeScan(manualBarcode);
    setManualBarcode("");
  };

  return (
    <div>
      <h1 className="pos-page-title">POS Terminal</h1>

      {/* ⭐ Scanner now sends barcode to POS */}
      <Scanner
        active={scannerActive}
        onScanSuccess={handleBarcodeScan}
      />

      <div className="pos-layout-row pos-responsive-layout">
        {/* LEFT COLUMN */}
        <div className="pos-scanner-column">
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
                className={
                  scannerActive
                    ? "pos-button-secondary"
                    : "pos-button"
                }
                onClick={() =>
                  setScannerActive((prev) => !prev)
                }
              >
                {scannerActive
                  ? "Stop Scanner"
                  : "Start Scanner"}
              </button>
            </div>

            <div className="pos-mt-md">
              <div className="pos-label">
                Manual barcode
              </div>
              <div className="pos-input-group">
                <input
                  type="text"
                  placeholder="Type barcode here"
                  value={manualBarcode}
                  onChange={(e) =>
                    setManualBarcode(e.target.value)
                  }
                  className="pos-input"
                />
                <button
                  className="pos-button pos-input-button"
                  onClick={handleAddManualBarcode}
                >
                  Add
                </button>
              </div>

              <div className="pos-muted pos-mt-md">
                Use camera scanner or manual input.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pos-cart-column">
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Cart Overview</span>
              <span className="pos-chip">
                {cart.length} items
              </span>
            </div>

            <p className="pos-muted">
              Scan products to build your cart.
            </p>

            <div className="pos-mt-lg pos-text-right">
              <button
                className="pos-button-secondary pos-full-width-mobile"
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
