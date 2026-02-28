import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserSales, deleteUserSale } from "../services/dataService";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

export default function ReceiptList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, userProfile } = useAuth();

  // 🔹 FETCH USER RECEIPTS
  const fetchSales = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      const list = await getUserSales(currentUser.uid);
      setSales(list);
    } catch (error) {
      console.error('Error fetching user receipts:', error);
      setError('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchSales();
    }
  }, [currentUser, fetchSales]);

  // 🔹 DELETE RECEIPT
  const handleDelete = async (id) => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;

    try {
      await deleteUserSale(currentUser.uid, id);
      setSales((prev) => prev.filter((sale) => sale.id !== id));
      alert("Receipt deleted successfully!");
    } catch (err) {
      console.error("Error deleting receipt:", err);
      alert('Error deleting receipt. Please try again.');
    }
  };

  // 🔹 PRINT RECEIPT AS PDF
  const handlePrint = (sale) => {
    try {
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
      doc.text("SALE RECEIPT", centerX, y, { align: "center" });
      y += 10;

      // Receipt Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Receipt #: ${sale.id}`, 15, y);
      y += 6;
      
      // Safe date formatting
      const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date);
      doc.text(`Date: ${saleDate.toLocaleDateString()} ${saleDate.toLocaleTimeString()}`, 15, y);
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
          doc.text(`₱${price.toFixed(2)}`, 80, y, { align: "right" });
          doc.text(quantity.toString(), 110, y, { align: "center" });
          doc.text(`₱${(price * quantity).toFixed(2)}`, 140, y, { align: "right" });
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
      doc.text(`Total: ₱${total.toFixed(2)}`, 140, y, { align: "right" });
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const cash = typeof sale.cash === 'number' ? sale.cash : total;
      const change = typeof sale.change === 'number' ? sale.change : 0;
      doc.text(`Cash Received: ₱${cash.toFixed(2)}`, 140, y, { align: "right" });
      y += 6;
      doc.text(`Change: ₱${change.toFixed(2)}`, 140, y, { align: "right" });
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

  return (
    <div>
      <h1 className="pos-page-title">Transactions</h1>
      
      {loading ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#aab2c5' 
        }}>
          Loading receipts...
        </div>
      ) : error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#ff6b8a' 
        }}>
          {error}
        </div>
      ) : sales.length === 0 ? (
        <p className="pos-muted">No receipts yet.</p>
      ) : (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Cash</th>
                <th>Change</th>
                <th>Items</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>
                    {(() => {
                      const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date);
                      return saleDate.toLocaleString();
                    })()}
                  </td>
                  <td>₱{typeof sale.total === 'number' ? sale.total.toFixed(2) : '0.00'}</td>
                  <td>₱{typeof sale.cash === 'number' ? sale.cash.toFixed(2) : '0.00'}</td>
                  <td>₱{typeof sale.change === 'number' ? sale.change.toFixed(2) : '0.00'}</td>
                  <td>{sale.items && Array.isArray(sale.items) ? sale.items.length : 0}</td>
                  <td>
                    <div className="pos-action-buttons">
                      <Link to={`/receipt/${sale.id}`}>
                        <button className="pos-button-secondary">View</button>
                      </Link>
                      <button
                        className="pos-button-danger"
                        onClick={() => handleDelete(sale.id)}
                      >
                        Delete
                      </button>
                      {userProfile?.permissions?.print && (
                        <button
                          className="pos-button"
                          onClick={() => handlePrint(sale)}
                        >
                          Print
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
