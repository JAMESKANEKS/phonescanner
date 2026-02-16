import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Receipts() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      const q = query(collection(db, "sales"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSales(list);
    };

    fetchSales();
  }, []);

  if (sales.length === 0) return <p>No receipts yet.</p>;

  return (
    <div>
      <h1>All Receipts</h1>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{sale.date?.toDate().toLocaleString()}</td>
              <td>₱{sale.total}</td>
              <td>
                <Link to={`/receipt/${sale.id}`}>
                  <button>View</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
