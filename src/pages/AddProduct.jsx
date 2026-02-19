import { useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import Scanner from "../components/Scanner";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const barcodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  // 🔥 Generate Unique Barcode
  const generateBarcode = () => {
    const code = Date.now().toString();
    setBarcode(code);

    JsBarcode(barcodeRef.current, code, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
    });
  };

  // 🔍 Handle scanned barcode from Scanner component
  const handleScan = (scannedCode) => {
    setBarcode(scannedCode);

    JsBarcode(barcodeRef.current, scannedCode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
    });

    setScanning(false);
  };

  // 💾 SAVE PRODUCT (PREVENT DUPLICATE BARCODE)
  const saveProduct = async () => {
    if (!name || !price || !barcode || stock === "") {
      alert("Fill all fields!");
      return;
    }

    try {
      // 🔎 CHECK IF BARCODE EXISTS
      const q = query(
        collection(db, "products"),
        where("barcode", "==", barcode)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("⚠️ Barcode already exists!");
        return;
      }

      // ✅ SAVE IF UNIQUE
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        stock: Number(stock),
        barcode,
      });

      alert("✅ Product Added!");

      setName("");
      setPrice("");
      setStock("");
      setBarcode("");
    } catch (error) {
      console.error("Error saving product:", error);
      if (error.code === 'permission-denied') {
        alert("Permission denied: You don't have access to add products.");
      } else if (error.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (error.code === 'resource-exhausts') {
        alert("Quota exceeded: Please try again later.");
      } else {
        alert("Error saving product: " + error.message);
      }
    }
  };

  return (
    <div>
      <h1 className="pos-page-title">Inventory &amp; Barcodes</h1>

      <div className="pos-layout-row">
        {/* Product form */}
        <div style={{ flex: "1 1 320px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>New product</span>
            </div>

            <div className="pos-mt-md">
              <div className="pos-label">Product name</div>
              <input
                className="pos-input"
                placeholder="Ex. iPhone 15 Pro Max"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="pos-mt-md pos-layout-row">
              <div style={{ flex: 1, minWidth: 120 }}>
                <div className="pos-label">Price</div>
                <input
                  className="pos-input"
                  placeholder="₱0.00"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div className="pos-label">Stock</div>
                <input
                  className="pos-input"
                  placeholder="0"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>

            <div className="pos-mt-lg pos-flex-between">
              <button className="pos-button-secondary" onClick={generateBarcode}>
                Generate Barcode
              </button>
              <button
                className="pos-button-secondary"
                onClick={() => setScanning(!scanning)}
              >
                {scanning ? "Stop Scanner" : "Scan Barcode"}
              </button>
              <button className="pos-button" onClick={saveProduct}>
                Save Product
              </button>
            </div>
          </div>
        </div>

        {/* Barcode preview / scanner */}
        <div style={{ flex: "1 1 300px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Barcode preview</span>
            </div>

            <div className="pos-mt-md" style={{ textAlign: "center" }}>
              <svg ref={barcodeRef}></svg>
            </div>

            <div className="pos-mt-md">
              <div className="pos-label">Camera barcode capture</div>
              <div className="pos-scanner-frame">
                <div
                  id="barcode-scanner"
                  className="pos-scanner-target"
                ></div>
              </div>
            </div>
          </div>

          {/* Hidden Scanner Component */}
          <Scanner 
            active={scanning} 
            scannerId="barcode-scanner" 
            onScan={handleScan}
          />
        </div>
      </div>
    </div>
  );
}
