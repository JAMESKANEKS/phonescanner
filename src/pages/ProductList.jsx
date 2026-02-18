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
  const [searchBarcode, setSearchBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const barcodeRefs = useRef({});
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

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

  // 🔥 FILTER PRODUCTS BASED ON SEARCH BARCODE
  useEffect(() => {
    if (searchBarcode.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.barcode.toLowerCase().includes(searchBarcode.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchBarcode]);

  // 🧹 CLEANUP SCANNER ON UNMOUNT
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch((err) => console.error("Error cleaning up scanner:", err));
      }
    };
  }, []);

  // 📷 START SCANNER WHEN isScanning CHANGES TO TRUE
  useEffect(() => {
    if (isScanning && scannerContainerRef.current) {
      startScanner();
    } else if (!isScanning) {
      stopScanner();
    }
  }, [isScanning]);


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
      if (err.code === 'permission-denied') {
        alert("Permission denied: You don't have access to products.");
      } else if (err.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (err.code === 'not-found') {
        alert("Products collection not found. Please contact support.");
      } else {
        alert("Error deleting product: " + err.message);
      }
    }
  };

  // 📷 START BARCODE SCANNER
  const startScanner = () => {
    if (scannerRef.current) return; // Prevent multiple scanners

    // Html5Qrcode expects a DOM element ID (string), not the element itself
    const scanner = new Html5Qrcode("product-list-scanner");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (barcode) => {
        setSearchBarcode(barcode);
        stopScanner();
      },
      (error) => {
        console.log("Scan error:", error);
      }
    ).catch((err) => {
      console.error("Error starting scanner:", err);
      alert("Error starting camera scanner. Please check camera permissions.");
      setIsScanning(false);
    });
  };

  // 🛑 STOP BARCODE SCANNER
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScanning(false);
      }).catch((err) => {
        console.error("Error stopping scanner:", err);
      });
    }
  };


  return (
    <div>
      <h1>Product List</h1>

      {/* 🔍 SEARCH BARCODE */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter or scan barcode to search"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", width: "200px" }}
        />
        <button onClick={() => setIsScanning(!isScanning)}>
          {isScanning ? "Stop Scanning" : "Scan Barcode"}
        </button>
      </div>

      {/* 📷 BARCODE SCANNER */}
      {isScanning && (
        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px", width: "320px" }}>
          <h3>Scan Barcode</h3>
          <div
            id="product-list-scanner"
            ref={scannerContainerRef}
            style={{ width: "300px", height: "250px" }}
          ></div>
          <button onClick={stopScanner} style={{ marginTop: "10px", padding: "5px 10px" }}>
            Stop Scanning
          </button>
        </div>
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
