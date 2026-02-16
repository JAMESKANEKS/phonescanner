import { useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { db } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const barcodeRef = useRef(null);

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

  const saveProduct = async () => {
    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      barcode,
      stock: 0,
    });

    alert("Product Added!");
  };

  return (
    <div>
      <h1>Add Product</h1>

      <input
        placeholder="Product Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Price"
        type="number"
        onChange={(e) => setPrice(e.target.value)}
      />

      <br /><br />

      <button onClick={generateBarcode}>
        Generate Barcode
      </button>

      <br /><br />

      <svg ref={barcodeRef}></svg>

      <br /><br />

      <button onClick={saveProduct}>
        Save Product
      </button>
    </div>
  );
}
