import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { addUserSale, updateUserProduct } from "../services/dataService";
import { getUserProducts } from "../services/dataService";
import jsPDF from "jspdf";

export default function Cart() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { cart, clearCart, loading: cartLoading, increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [cash, setCash] = useState(""); // 💵 Cash input
  const [change, setChange] = useState(0); // 💰 Change

  // 💰 Calculate change whenever cash changes
  useEffect(() => {
    const cashNum = parseFloat(cash) || 0;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedChange = cashNum - total;
    setChange(calculatedChange);
  }, [cash, cart]);

  // 💵 Handle cash input with validation
  const handleCashChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCash(value);
    }
  };

  // �️ PRINT RECEIPT FUNCTION
  const printReceipt = () => {
    if (cart.length === 0) {
      alert("No items to print!");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    let y = 15;

    // Header - Store Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PHONE SCANNER POS", centerX, y, { align: "center" });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("123 Main Street, City", centerX, y, { align: "center" });
    y += 5;
    doc.text("Tel: (123) 456-7890", centerX, y, { align: "center" });
    y += 5;
    doc.text("Email: info@phonescanner.com", centerX, y, { align: "center" });
    y += 10;

    // Separator
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // Receipt Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("QUOTATION", centerX, y, { align: "center" });
    y += 10;

    // Receipt Details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, y);
    y += 10;

    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Item", 15, y);
    doc.text("Price", 80, y, { align: "right" });
    doc.text("Qty", 110, y, { align: "center" });
    doc.text("Total", 140, y, { align: "right" });
    y += 5;
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    // Table Rows
    doc.setFont("helvetica", "normal");
    cart.forEach((item) => {
      if (y > 250) {
        doc.addPage();
        y = 15;
      }
      const itemName = item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name;
      doc.text(itemName, 15, y);
      doc.text(`P${item.price}`, 80, y, { align: "right" });
      doc.text(item.quantity.toString(), 110, y, { align: "center" });
      doc.text(`P${item.price * item.quantity}`, 140, y, { align: "right" });
      y += 6;
    });

    // Bottom line
    y += 2;
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    doc.text(`Total: P${total.toFixed(2)}`, 140, y, { align: "right" });
    y += 10;

    // Footer
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Thank you for your purchase!", centerX, y, { align: "center" });
    y += 5;
    doc.text("Please come again!", centerX, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.save(`Quotation_${new Date().getTime()}.pdf`);
  };

  // � COMPLETE SALE
  const completeSale = async () => {
    if (!currentUser) {
      alert("Please login to complete sale");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const cashNum = parseFloat(cash) || 0;
    const grandTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cashNum < grandTotal) {
      alert("Insufficient cash!");
      return;
    }

    // 🔍 CHECK STOCK FOR EACH ITEM
    try {
      const userProducts = await getUserProducts(currentUser.uid);
      
      for (const item of cart) {
        // Use productId if available, otherwise fall back to id
        const productIdentifier = item.productId || item.id;
        const product = userProducts.find(p => p.id === productIdentifier);
        
        if (!product) {
          alert(`Product ${item.name} not found!`);
          return;
        }
        
        const currentStock = product.stock || 0;
        if (item.quantity > currentStock) {
          alert(`⚠️ Not enough stock for ${item.name}! Available: ${currentStock}, Required: ${item.quantity}`);
          return;
        }
      }

      setLoading(true);

      // ✅ SAVE SALE TO USER-SPECIFIC COLLECTION
      const saleId = await addUserSale(currentUser.uid, {
        items: cart,
        total: grandTotal,
        cash: cashNum,
        change: cashNum - grandTotal,
      });

      // 📦 UPDATE STOCK FOR EACH SOLD ITEM
      for (const item of cart) {
        const productIdentifier = item.productId || item.id;
        const product = userProducts.find(p => p.id === productIdentifier);
        
        if (product) {
          const currentStock = product.stock || 0;
          const newStock = currentStock - item.quantity;
          
          await updateUserProduct(currentUser.uid, productIdentifier, { stock: newStock });
        }
      }

      // 🧹 CLEAR USER CART
      await clearCart();

      alert(`Sale completed! Change: ₱${(cashNum - grandTotal).toFixed(2)}`);
      navigate(`/receipt/${saleId}`);
    } catch (err) {
      console.error("Error completing sale:", err);
      alert("Error completing sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="pos-page-title">Checkout</h1>

      {cartLoading ? (
        <p className="pos-muted">Loading cart...</p>
      ) : (
        <div className="pos-layout-row">
          {/* Items list */}
          <div style={{ flex: "1 1 420px" }}>
            <div className="pos-card">
              <div className="pos-card-header">
                <span>Cart items</span>
                <span className="pos-chip">{cart.length} items</span>
              </div>

              {cart.length === 0 ? (
                <p className="pos-muted">No items in cart.</p>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(56, 64, 90, 0.7)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {item.name}
                      </div>
                      <div className="pos-muted">
                        ₱{item.price} each
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div className="pos-chip">
                        ₱{item.price * item.quantity}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          className="pos-button-secondary"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          className="pos-button-secondary"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                        <button
                          className="pos-button-danger"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals + payment */}
          <div style={{ flex: "0 0 280px" }}>
            <div className="pos-card">
              <div className="pos-card-header">
                <span>Payment</span>
              </div>

              <div className="pos-total-row">
                Grand Total: ₱{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </div>

              <div className="pos-mt-md">
                <div className="pos-label">Cash received</div>
                <input
                  type="text"
                  value={cash}
                  onChange={handleCashChange}
                  className="pos-input"
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <div className="pos-mt-md pos-text-right">
                  <span className="pos-muted">
                    Change: ₱{change < 0 ? 0 : change.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pos-mt-md pos-text-right">
                <button
                  className="pos-button-secondary"
                  onClick={printReceipt}
                  disabled={cart.length === 0}
                  style={{ 
                    marginRight: '10px',
                    display: userProfile?.permissions?.print !== false ? 'inline-block' : 'none'
                  }}
                >
                  Print Quote
                </button>
                <button
                  className="pos-button-danger"
                  onClick={completeSale}
                  disabled={loading || cart.length === 0 || !cash || parseFloat(cash) < cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                >
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
