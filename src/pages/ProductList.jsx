import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import JsBarcode from "jsbarcode";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [hiddenBarcodes, setHiddenBarcodes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const barcodeRefs = useRef({});

  // 🔥 FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const list = [];
      const hiddenState = {};

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        list.push(data);
        hiddenState[doc.id] = true;
      });

      setProducts(list);
      setHiddenBarcodes(hiddenState);
    };

    fetchProducts();
  }, []);

  // 🔥 GENERATE BARCODE WHEN SHOWN
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

  // 🔁 TOGGLE BARCODE
  const toggleBarcode = (id) => {
    setHiddenBarcodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ✏️ START EDIT
  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData(product);
  };

  // ❌ CANCEL EDIT
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // 💾 SAVE EDIT
  const saveEdit = async () => {
    const productRef = doc(db, "products", editingId);

    await updateDoc(productRef, {
      name: editData.name,
      price: Number(editData.price),
      stock: Number(editData.stock),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, ...editData } : p))
    );

    setEditingId(null);
  };

  // 🗑️ DELETE PRODUCT
  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product. Check console for details.");
    }
  };

  return (
    <div>
      <h1>Product List</h1>

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
              {/* NAME */}
              <td>
                {editingId === product.id ? (
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                ) : (
                  product.name
                )}
              </td>

              {/* PRICE */}
              <td>
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({ ...editData, price: e.target.value })
                    }
                  />
                ) : (
                  `₱${product.price}`
                )}
              </td>

              {/* STOCK */}
              <td>
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editData.stock}
                    onChange={(e) =>
                      setEditData({ ...editData, stock: e.target.value })
                    }
                  />
                ) : (
                  product.stock
                )}
              </td>

              {/* BARCODE */}
              <td>
                {!hiddenBarcodes[product.id] ? (
                  <svg ref={(el) => (barcodeRefs.current[product.id] = el)}></svg>
                ) : (
                  <span>Hidden</span>
                )}
              </td>

              {/* ACTION BUTTONS */}
              <td>
                <button onClick={() => toggleBarcode(product.id)}>
                  {hiddenBarcodes[product.id] ? "Show Barcode" : "Hide Barcode"}
                </button>

                {editingId === product.id ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => startEdit(product)}>Edit</button>
                )}

                {/* ❌ DELETE BUTTON */}
                <button
                  onClick={() => deleteProduct(product.id)}
                  style={{
                    marginLeft: "5px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
