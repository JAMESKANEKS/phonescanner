import { useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const barcodeRef = useRef(null);
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  // 🔥 Generate Barcode
  const generateBarcode = () => {
    const code = Date.now().toString(); // unique code
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

    html5Qrcode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (scannedCode) => {
        setBarcode(scannedCode);

        // Show barcode image
        JsBarcode(barcodeRef.current, scannedCode, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
        });

        html5Qrcode.stop();
        setScanning(false);
      }
    ).catch((err) => {
      console.error("Scanner error:", err);
      setScanning(false);
    });

    scannerRef.current = html5Qrcode;
  };

  const saveProduct = async () => {
    if (!name || !price || !barcode) {
      alert("Please fill all fields and generate or scan barcode!");
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      barcode,
      stock: 0,
    });

    alert("Product Added!");
    setName("");
    setPrice("");
    setBarcode("");
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

      <br /><br />

      <button onClick={generateBarcode}>
        Generate Barcode
      </button>

      <button onClick={startScan} disabled={scanning}>
        {scanning ? "Scanning..." : "Scan Barcode"}
      </button>

      <br /><br />

      <svg ref={barcodeRef}></svg>

      {/* Scanner preview */}
      <div id="barcode-scanner" style={{ width: "300px", height: "250px" }}></div>

      <br /><br />

      <button onClick={saveProduct}>
        Save Product
      </button>
    </div>
  );
}
