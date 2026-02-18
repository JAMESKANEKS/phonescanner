import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import JsBarcode from "jsbarcode";
import { Html5Qrcode } from "html5-qrcode";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [hiddenBarcodes, setHiddenBarcodes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [scanning, setScanning] = useState(false);

  const barcodeRefs = useRef({});
  const qrCodeRegionRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // 🔥 FETCH PRODUCTS
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
    setFilteredProducts(list);
    setHiddenBarcodes(hiddenState);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔁 FILTER PRODUCTS BY BARCODE INPUT
  useEffect(() => {
    if (!barcodeSearch) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((p) =>
        p.barcode.includes(barcodeSearch)
      );
      setFilteredProducts(filtered);
    }
  }, [barcodeSearch, products]);

  // 🔥 GENERATE BARCODE WHEN SHOWN
  useEffect(() => {
    filteredProducts.forEach((p) => {
      if (barcodeRefs.current[p.id] && !hiddenBarcodes[p.id]) {
        JsBarcode(barcodeRefs.current[p.id], p.barcode, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
        });
      }
    });
  }, [filteredProducts, hiddenBarcodes]);

  // 🔁 TOGGLE BARCODE
  const toggleBarcode = (id) => {
    setHiddenBarcodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ✏️ EDIT FUNCTIONS
  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData(product);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };
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
      setFilteredProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product. Check console for details.");
    }
  };

  // 📷 START CAMERA SCAN
  const startScan = () => {
    if (scanning) return; // already scanning
    setScanning(true);
  };

  // 🔹 STOP SCAN FUNCTION
  const stopScan = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current.clear().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  // 🔹 HANDLE CAMERA WHEN SCANNING TRUE
  useEffect(() => {
    if (!scanning) return;
    if (!qrCodeRegionRef.current) return;

    const qrCodeRegionId = "qr-code-region";
    const html5Qrcode = new Html5Qrcode(qrCodeRegionId);
    html5QrCodeRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setBarcodeSearch(decodedText); // update input to filter products
          // Stop camera after successful scan (same as AddProduct)
          html5Qrcode.stop().then(() => {
            html5Qrcode.clear().then(() => {
              setScanning(false);
            }).catch(() => {
              setScanning(false);
            });
          }).catch(() => {
            setScanning(false);
          });
        },
        (errorMessage) => {
          // ignore scan errors
        }
      )
      .catch((err) => {
        console.error("Camera start error:", err);
        setScanning(false);
      });

    // Cleanup function for when component unmounts
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [scanning]);

  // 🔹 CLEANUP ON COMPONENT UNMOUNT AND WINDOW UNLOAD
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force cleanup when navigating away
      setScanning(false);
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (err) {
          console.log("Camera cleanup error:", err);
        }
        html5QrCodeRef.current = null;
      }
    };

    // Add beforeunload listener for navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also cleanup on unmount
    };
  }, []);

  return (
    <div>
      <h1>Product List</h1>

      {/* 🔹 SEARCH BARCODE INPUT & SCAN BUTTON */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Enter barcode manually..."
          value={barcodeSearch}
          onChange={(e) => setBarcodeSearch(e.target.value)}
          style={{ padding: "8px", width: "250px" }}
        />
        <button
          onClick={startScan}
          style={{ marginLeft: "5px", padding: "8px" }}
          disabled={scanning}
        >
          {scanning ? "Scanning..." : "Scan"}
        </button>
        <button
          onClick={() => setBarcodeSearch("")}
          style={{ marginLeft: "5px", padding: "8px" }}
        >
          Clear
        </button>
      </div>

      {/* 🔹 CAMERA SCAN REGION */}
      {scanning && (
        <div
          id="qr-code-region"
          style={{
            width: "100%",
            maxWidth: "400px", // prevent overflow
            height: "300px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            overflow: "hidden",
          }}
          ref={qrCodeRegionRef}
        ></div>
      )}

      {/* 🔹 PRODUCT TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
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
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{editingId === product.id ? <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /> : product.name}</td>
                <td>{editingId === product.id ? <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} /> : `₱${product.price}`}</td>
                <td>{editingId === product.id ? <input type="number" value={editData.stock} onChange={(e) => setEditData({ ...editData, stock: e.target.value })} /> : product.stock}</td>
                <td>{!hiddenBarcodes[product.id] ? <svg ref={(el) => (barcodeRefs.current[product.id] = el)}></svg> : <span>Hidden</span>}</td>
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
                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={{ marginLeft: "5px", backgroundColor: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && <p>No products found.</p>}
    </div>
  );
}
