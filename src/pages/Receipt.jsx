import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, Link } from "react-router-dom";

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
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSale();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <p>Loading receipt...</p>;
  }

  if (!sale) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Receipt not found.</p>
        <Link to="/receipts">
          <button>Back to All Receipts</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>SALE RECEIPT</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <p><strong>Receipt ID:</strong> {sale.id}</p>
          <p><strong>Date:</strong> {sale.date.toLocaleString()}</p>
        </div>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginBottom: "20px" }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items && sale.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>₱{item.price.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₱{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: "right", fontSize: "18px", fontWeight: "bold" }}>
          <p><strong>Total: ₱{sale.total.toFixed(2)}</strong></p>
        </div>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <p>Thank you for your purchase!</p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Link to="/receipts">
          <button style={{ padding: "10px 20px" }}>Back to All Receipts</button>
        </Link>
      </div>
    </div>
  );
}
