import { useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Html5Qrcode } from "html5-qrcode";
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
  const scannerRef = useRef(null);
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

  // 🔍 Scan Barcode from Camera
  const startScan = () => {
    setScanning(true);
    const html5Qrcode = new Html5Qrcode("barcode-scanner");

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (scannedCode) => {
          setBarcode(scannedCode);

          JsBarcode(barcodeRef.current, scannedCode, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
          });

          html5Qrcode.stop();
          setScanning(false);
        }
      )
      .catch((err) => {
        console.error("Scanner error:", err);
        setScanning(false);
      });

    scannerRef.current = html5Qrcode;
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
      alert("Failed to save product");
    }
  };

  return (
    <div>
      <h1>Add Product</h1>

      <input
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        placeholder="Stock Quantity"
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />

      <br /><br />

      <button onClick={generateBarcode}>
        Generate Barcode
      </button>

      <button onClick={startScan} disabled={scanning}>
        {scanning ? "Scanning..." : "Scan Barcode"}
      </button>

      <br /><br />

      <svg ref={barcodeRef}></svg>

      <div id="barcode-scanner" style={{ width: "300px", height: "250px" }}></div>

      <br /><br />

      <button onClick={saveProduct}>
        Save Product
      </button>
    </div>
  );
}
