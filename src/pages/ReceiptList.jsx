import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

export default function ReceiptList() {
  const [sales, setSales] = useState([]);

  // 🔹 FETCH RECEIPTS
  const fetchSales = async () => {
    try {
      const q = query(collection(db, "sales"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date.toDate() : new Date(),
        };
      });
      setSales(list);
    } catch (err) {
      console.error("Error fetching receipts:", err);
      if (err.code === 'permission-denied') {
        alert("Permission denied: You don't have access to receipts.");
      } else if (err.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (err.code === 'not-found') {
        alert("Receipts collection not found. Please contact support.");
      } else {
        alert("Error loading receipts: " + err.message);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => fetchSales(), 0);
  }, []);

  // 🔹 DELETE RECEIPT
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;

    try {
      await deleteDoc(doc(db, "sales", id));
      setSales((prev) => prev.filter((sale) => sale.id !== id));
      alert("Receipt deleted successfully!");
    } catch (err) {
      console.error("Error deleting receipt:", err);
      if (err.code === 'permission-denied') {
        alert("Permission denied: You don't have access to delete receipts.");
      } else if (err.code === 'unavailable') {
        alert("Service unavailable: Please check your internet connection.");
      } else if (err.code === 'not-found') {
        alert("Receipt not found. It may have been already deleted.");
      } else {
        alert("Error deleting receipt: " + err.message);
      }
    }
  };

  // 🔹 PRINT RECEIPT AS PDF
  const handlePrint = (sale) => {
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
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item) => {
        if (y > 250) {
          doc.addPage();
          y = 15;
        }
        const itemName = item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name;
        doc.text(itemName, 15, y);
        doc.text(`P${Math.round(item.price)}`, 80, y, { align: "right" });
        doc.text(item.quantity.toString(), 110, y, { align: "center" });
        doc.text(`P${Math.round(item.price * item.quantity)}`, 140, y, { align: "right" });
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
    doc.text(`Total: P${Math.round(sale.total)}`, 140, y, { align: "right" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const cash = sale.cash ?? sale.total; // fallback if not saved
    const change = sale.change ?? 0;
    doc.text(`Cash Received: P${Math.round(cash)}`, 140, y, { align: "right" });
    y += 6;
    doc.text(`Change: P${Math.round(change)}`, 140, y, { align: "right" });
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
  };

  return (
    <div>
      <h1 className="pos-page-title">Transactions</h1>
      {sales.length === 0 ? (
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
                  <td>{sale.date.toLocaleString()}</td>
                  <td>₱{sale.total.toFixed(2)}</td>
                  <td>₱{sale.cash ? sale.cash.toFixed(2) : 0}</td>
                  <td>₱{sale.change ? sale.change.toFixed(2) : 0}</td>
                  <td>{sale.items ? sale.items.length : 0}</td>
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
                      <button
                        className="pos-button"
                        onClick={() => handlePrint(sale)}
                      >
                        Print
                      </button>
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
