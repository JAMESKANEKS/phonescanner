import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserSale } from "../services/dataService";
import { useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";

export default function Receipt() {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const fetchSale = async () => {
      if (!currentUser || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const saleData = await getUserSale(currentUser.uid, id);
        
        if (saleData) {
          // Handle date formatting
          let formattedDate = new Date();
          if (saleData.date) {
            if (saleData.date instanceof Date) {
              formattedDate = saleData.date;
            } else if (saleData.date.seconds) {
              formattedDate = new Date(saleData.date.seconds * 1000);
            } else {
              formattedDate = new Date(saleData.date);
            }
          }
          
          setSale({
            ...saleData,
            date: formattedDate,
          });
        } else {
          setError("Receipt not found");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        if (err.code === 'permission-denied') {
          setError("Permission denied: You don't have access to this receipt.");
        } else if (err.code === 'unavailable') {
          setError("Service unavailable: Please check your internet connection.");
        } else if (err.code === 'not-found') {
          setError("Receipt not found: This receipt may have been deleted or doesn't exist.");
        } else {
          setError("Error loading receipt: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [currentUser, id]);

  // 🔹 PRINT RECEIPT AS PDF
  const handlePrint = (sale) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;
      let y = 15;

      // Separator
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;

      // Receipt Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SALE RECEIPT", centerX, y, { align: "center" });
      y += 10;

      // Receipt Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Receipt #: ${sale.id}`, 15, y);
      y += 6;
      doc.text(`Date: ${sale.date.toLocaleDateString()} ${sale.date.toLocaleTimeString()}`, 15, y);
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
      if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach((item) => {
          if (y > 250) {
            doc.addPage();
            y = 15;
          }
          const itemName = item.name && item.name.length > 25 ? item.name.substring(0, 22) + "..." : (item.name || 'Unknown Item');
          const price = typeof item.price === 'number' ? item.price : 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
          
          doc.text(itemName, 15, y);
          doc.text(`P${price.toFixed(2)}`, 80, y, { align: "right" });
          doc.text(quantity.toString(), 110, y, { align: "center" });
          doc.text(`P${(price * quantity).toFixed(2)}`, 140, y, { align: "right" });
          y += 6;
        });
      }

      // Bottom line
      y += 2;
      doc.line(15, y, pageWidth - 15, y);
      y += 6;

      // Total, Cash, Change
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const total = typeof sale.total === 'number' ? sale.total : 0;
      doc.text(`Total: P${total.toFixed(2)}`, 140, y, { align: "right" });
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const cash = typeof sale.cash === 'number' ? sale.cash : total;
      const change = typeof sale.change === 'number' ? sale.change : 0;
      doc.text(`Cash Received: P${cash.toFixed(2)}`, 140, y, { align: "right" });
      y += 6;
      doc.text(`Change: P${change.toFixed(2)}`, 140, y, { align: "right" });
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

      doc.save(`Receipt_${sale.id}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#aab2c5' 
      }}>
        Loading receipt...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div>
        <h1 className="pos-page-title">Receipt</h1>
        <div className="pos-card">
          {error ? (
            <div style={{
              background: 'rgba(255, 77, 106, 0.1)',
              border: '1px solid rgba(255, 77, 106, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#ff6b8a',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          ) : (
            <p className="pos-muted">Receipt not found.</p>
          )}
          <Link to="/receipts">
            <button className="pos-button-secondary">
              Back to All Receipts
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="pos-page-title">Receipt</h1>
      <div className="pos-card" style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
          SALE RECEIPT
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <p>
            <strong>Receipt ID:</strong> {sale.id}
          </p>
          <p>
            <strong>Date:</strong> {sale.date.toLocaleString()}
          </p>
        </div>

        <table className="pos-table" style={{ marginBottom: "16px" }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items &&
              sale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>₱{item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="pos-total-row">
          Total: ₱{sale.total.toFixed(2)}
          {sale.cash && (
            <>
              <p style={{ marginTop: 8 }}>
                Cash: ₱{sale.cash.toFixed(2)}
              </p>
              <p>Change: ₱{sale.change.toFixed(2)}</p>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p className="pos-muted">Thank you for your purchase!</p>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button 
          className="pos-button" 
          onClick={() => handlePrint(sale)}
          style={{
            display: userProfile?.permissions?.print !== false ? 'inline-block' : 'none'
          }}
        >
          🖨️ Print Receipt
        </button>
        <Link to="/receipts">
          <button className="pos-button-secondary">
            Back to All Receipts
          </button>
        </Link>
      </div>
    </div>
  );
}
