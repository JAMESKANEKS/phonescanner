import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import JsBarcode from "jsbarcode";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [hiddenBarcodes, setHiddenBarcodes] = useState({}); // true = hidden
  const barcodeRefs = useRef({}); // store SVG refs

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const list = [];
      const hiddenState = {}; // default all hidden
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        list.push(data);
        hiddenState[doc.id] = true; // default hidden
      });
      setProducts(list);
      setHiddenBarcodes(hiddenState);
    };

    fetchProducts();
  }, []);

  // Generate barcode SVGs when unhidden
  useEffect(() => {
    products.forEach((p) => {
      if (barcodeRefs.current[p.id] && !hiddenBarcodes[p.id]) {
        JsBarcode(barcodeRefs.current[p.id], p.barcode, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
        });
      }
    });
  }, [products, hiddenBarcodes]);

  const toggleBarcode = (id) => {
    setHiddenBarcodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <h1>Product List</h1>
      {products.length === 0 && <p>No products yet.</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Barcode</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>₱{product.price}</td>
              <td>{product.stock}</td>
              <td>
                {!hiddenBarcodes[product.id] ? (
                  <svg ref={(el) => (barcodeRefs.current[product.id] = el)}></svg>
                ) : (
                  <span>Hidden</span>
                )}
              </td>
              <td>
                <button onClick={() => toggleBarcode(product.id)}>
                  {hiddenBarcodes[product.id] ? "Show" : "Hide"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
