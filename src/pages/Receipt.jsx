import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";

export default function Receipt() {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const docRef = doc(db, "sales", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSale({
            id: docSnap.id,
            ...data,
            date: data.date ? data.date.toDate() : new Date(),
          });
        } else {
          console.log("No such document!");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        if (err.code === 'permission-denied') {
          alert("Permission denied: You don't have access to this receipt.");
        } else if (err.code === 'unavailable') {
          alert("Service unavailable: Please check your internet connection.");
        } else if (err.code === 'not-found') {
          alert("Receipt not found: This receipt may have been deleted or doesn't exist.");
        } else {
          alert("Error loading receipt: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSale();
    else setLoading(false);
  }, [id]);

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

  if (loading) return <p className="pos-muted">Loading receipt...</p>;

  if (!sale)
    return (
      <div>
        <h1 className="pos-page-title">Receipt</h1>
        <div className="pos-card">
          <p className="pos-muted">Receipt not found.</p>
          <Link to="/receipts">
            <button className="pos-button-secondary">
              Back to All Receipts
            </button>
          </Link>
        </div>
      </div>
    );

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
        <button className="pos-button" onClick={() => handlePrint(sale)}>
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
