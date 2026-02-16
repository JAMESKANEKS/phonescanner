import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function ReceiptList() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
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
      }
    };

    fetchSales();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>All Receipts</h1>
      {sales.length === 0 ? (
        <p>No receipts yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Items Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.date.toLocaleString()}</td>
                <td>₱{sale.total.toFixed(2)}</td>
                <td>{sale.items ? sale.items.length : 0}</td>
                <td>
                  <Link to={`/receipt/${sale.id}`}>
                    <button style={{ padding: "5px 10px" }}>View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
