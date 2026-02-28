import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProducts, updateUserProduct, deleteUserProduct } from "../services/dataService";
import JsBarcode from "jsbarcode";
import Scanner from "../components/Scanner";

export default function ProductList() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hiddenBarcodes, setHiddenBarcodes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchBarcode, setSearchBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const barcodeRefs = useRef({});
  const scannerContainerRef = useRef(null);

  //  FETCH USER PRODUCTS
  const fetchProducts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      const list = await getUserProducts(currentUser.uid);
      const hiddenState = {};
      list.forEach((product) => {
        hiddenState[product.id] = true;
      });
      setProducts(list);
      setFilteredProducts(list);
      setHiddenBarcodes(hiddenState);
    } catch (error) {
      console.error('Error fetching user products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
    
    // Wait longer when page loads to ensure any previous scanner is fully stopped
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [currentUser, fetchProducts]);

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



  // 🔥 GENERATE BARCODE WHEN SHOWN
  useEffect(() => {
    const cleanupFunctions = [];
    
    filteredProducts.forEach((p) => {
      if (barcodeRefs.current[p.id] && !hiddenBarcodes[p.id]) {
        try {
          JsBarcode(barcodeRefs.current[p.id], p.barcode, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
          });
        } catch (error) {
          console.error('Error generating barcode for product', p.id, error);
        }
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
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
    if (!currentUser) return;
    
    // Validation
    if (!editData.name || !editData.name.trim()) {
      alert('Product name is required');
      return;
    }
    
    if (!editData.price || editData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    
    if (!editData.stock || editData.stock < 0) {
      alert('Stock must be 0 or greater');
      return;
    }
    
    try {
      await updateUserProduct(currentUser.uid, editingId, {
        name: editData.name.trim(),
        price: Number(editData.price),
        stock: Number(editData.stock),
      });
      
      // Update both products and filteredProducts arrays
      const updatedProduct = { ...editData, name: editData.name.trim(), price: Number(editData.price), stock: Number(editData.stock) };
      
      setProducts(prev => prev.map((p) => (p.id === editingId ? updatedProduct : p)));
      setFilteredProducts(prev => prev.map((p) => (p.id === editingId ? updatedProduct : p)));
      
      setEditingId(null);
      setEditData({});
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
    }
  };

  // 🗑️ DELETE PRODUCT
  const deleteProduct = async (productId) => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteUserProduct(currentUser.uid, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert('Error deleting product. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="pos-page-title">Product Catalog</h1>

      <div className="pos-layout-row">
        {/* Search + scanner */}
        <div className="pos-search-column">
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Search by barcode</span>
            </div>

            <div className="pos-label">Barcode</div>
            <div className="pos-input-group">
              <input
                type="text"
                placeholder="Enter or scan barcode"
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                className="pos-input"
                disabled={loading}
              />
              <button
                className={isScanning ? "pos-button-secondary" : "pos-button"}
                onClick={() => {
                  if (!isScanning) {
                    setIsScanning(true);
                    // Small delay to ensure DOM is ready, then enable scanner
                    // Scanner component handles camera release timing internally
                    setTimeout(() => {
                      setScannerReady(true);
                    }, 100);
                  } else {
                    setScannerReady(false);
                    setIsScanning(false);
                  }
                }}
                disabled={!isPageReady && !isScanning || loading}
              >
                {isScanning ? "Stop" : "Scan"}
              </button>
            </div>

            {error && (
              <div className="pos-mt-md" style={{
                background: 'rgba(255, 77, 106, 0.1)',
                border: '1px solid rgba(255, 77, 106, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#ff6b8a',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {isScanning && (
              <div className="pos-mt-md">
                <div className="pos-label">Camera scanner</div>
                <div className="pos-scanner-frame">
                  <div
                    id="product-list-scanner"
                    ref={scannerContainerRef}
                    className="pos-scanner-target"
                  ></div>
                </div>
                <div className="pos-mt-md pos-text-right">
                  <button
                    className="pos-button-secondary"
                    onClick={() => {
                      setScannerReady(false);
                      setIsScanning(false);
                    }}
                  >
                    Stop Scanner
                  </button>
                </div>
              </div>
            )}

            {/* Hidden Scanner Component */}
            <Scanner 
              active={isScanning && scannerReady} 
              scannerId="product-list-scanner"
              onScanSuccess={(barcode) => {
                setSearchBarcode(barcode);
                setScannerReady(false);
                setIsScanning(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* 🔹 PRODUCT TABLE */}
      <div className="pos-card pos-mt-lg" style={{ overflowX: "auto" }}>
        <div className="pos-card-header">
          <span>Products</span>
          <span className="pos-chip">{filteredProducts.length} items</span>
        </div>
        
        {loading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#aab2c5' 
          }}>
            Loading products...
          </div>
        ) : error ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#ff6b8a' 
          }}>
            {error}
          </div>
        ) : (
          <>
            <table className="pos-table">
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
                    <td>
                      {editingId === product.id ? (
                        <input
                          className="pos-input-sm"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                        />
                      ) : (
                        product.name
                      )}
                    </td>
                    <td>
                      {editingId === product.id ? (
                        <input
                          className="pos-input-sm"
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
                    <td>
                      {editingId === product.id ? (
                        <input
                          className="pos-input-sm"
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
                    <td>
                      {!hiddenBarcodes[product.id] ? (
                        <svg
                          ref={(el) => (barcodeRefs.current[product.id] = el)}
                        ></svg>
                      ) : (
                        <span>Hidden</span>
                      )}
                    </td>
                    <td>
                      <div className="pos-action-buttons">
                        <button
                          className="pos-button-secondary"
                          onClick={() => toggleBarcode(product.id)}
                        >
                          {hiddenBarcodes[product.id]
                            ? "Show Code"
                            : "Hide Code"
                        }
                        </button>
                        {editingId === product.id ? (
                          <>
                            <button
                              className="pos-button"
                              onClick={saveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="pos-button-secondary"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="pos-button-secondary"
                            onClick={() => startEdit(product)}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="pos-button-danger"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <p className="pos-muted pos-mt-md">No products found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
