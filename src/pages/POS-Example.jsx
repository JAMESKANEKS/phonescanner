import { useContext, useState } from "react";
import Scanner from "../components/Scanner";
import { CartContext } from "../context/CartContext";
import { syncService } from "../services/syncService";
import { where } from "firebase/firestore";

export default function POS() {
  const { cart, addToCart } = useContext(CartContext);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannerActive, setScannerActive] = useState(false);

  // ✅ Add product manually by barcode with offline support
  const handleAddManualBarcode = async () => {
    if (!manualBarcode) return alert("Enter a barcode!");

    try {
      // Use sync service for data fetching with offline fallback
      const products = await syncService.getData("products", [
        where("barcode", "==", manualBarcode)
      ]);

      if (products.length === 0) {
        return alert("Product not found!");
      }

      const productData = products[0];
      const currentStock = productData.stock || 0;

      // 🔍 CHECK STOCK AVAILABILITY
      if (currentStock <= 0) {
        alert(`⚠️ Product "${productData.name}" is out of stock!`);
        return;
      }

      const product = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
      };

      addToCart(product); // add to cart context
      setManualBarcode(""); // clear input
    } catch (err) {
      console.error("Error fetching product:", err);
      alert("Error fetching product. Please try again.");
    }
  };

  // Handle scanned barcode with offline support
  const handleScan = async (barcode) => {
    try {
      const products = await syncService.getData("products", [
        where("barcode", "==", barcode)
      ]);

      if (products.length === 0) {
        alert("Product not found!");
        return;
      }

      const productData = products[0];
      const currentStock = productData.stock || 0;

      if (currentStock <= 0) {
        alert(`⚠️ Product "${productData.name}" is out of stock!`);
        return;
      }

      const product = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
      };

      addToCart(product);
      // Keep scanner active for continuous scanning
    } catch (err) {
      console.error("Error processing scanned product:", err);
      alert("Error processing scanned product. Please try again.");
    }
  };

  // Save sale with offline support
  const handleSaveSale = async (saleData) => {
    try {
      const saleId = await syncService.saveData("sales", saleData);
      console.log("Sale saved with ID:", saleId);
      
      // Update product stock
      for (const item of cart) {
        const product = await syncService.getData("products", [
          where("id", "==", item.id)
        ]);
        
        if (product.length > 0) {
          const updatedProduct = {
            ...product[0],
            stock: (product[0].stock || 0) - 1
          };
          await syncService.saveData("products", updatedProduct, item.id);
        }
      }
      
      return saleId;
    } catch (err) {
      console.error("Error saving sale:", err);
      throw err;
    }
  };

  return (
    <div className="pos-container">
      <h1>Point of Sale</h1>
      
      <div className="barcode-input-section">
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="Enter barcode manually"
          className="barcode-input"
        />
        <button onClick={handleAddManualBarcode} className="add-button">
          Add Product
        </button>
        <button 
          onClick={() => setScannerActive(!scannerActive)} 
          className="scanner-button"
        >
          {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
        </button>
      </div>

      {scannerActive && (
        <div className="scanner-section">
          <Scanner onScan={handleScan} />
        </div>
      )}

      <div className="cart-section">
        <h2>Cart ({cart.length} items)</h2>
        {cart.map((item, index) => (
          <div key={index} className="cart-item">
            <span>{item.name}</span>
            <span>${item.price}</span>
          </div>
        ))}
        <div className="cart-total">
          <strong>Total: ${cart.reduce((sum, item) => sum + item.price, 0)}</strong>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={() => {
              const saleData = {
                items: cart,
                total: cart.reduce((sum, item) => sum + item.price, 0),
                timestamp: new Date().toISOString(),
                paymentMethod: 'cash'
              };
              handleSaveSale(saleData);
              // Clear cart logic here
              alert('Sale completed!');
            }}
            className="checkout-button"
          >
            Complete Sale
          </button>
        )}
      </div>
    </div>
  );
}
