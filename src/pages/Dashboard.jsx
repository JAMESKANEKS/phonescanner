import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  // 🔥 Fetch ALL sales on first load
  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    let q;

    // ✅ If no date → ALL TIME
    if (!fromDate || !toDate) {
      q = collection(db, "sales");
    } else {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      q = query(
        collection(db, "sales"),
        where("date", ">=", start),
        where("date", "<=", end)
      );
    }

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    calculateStats(data);
  };

  // 🔥 Calculate dashboard stats
  const calculateStats = (data) => {
    let earnings = 0;
    let productCount = 0;
    let productMap = {};
    let dailyMap = {};

    data.forEach((sale) => {
      earnings += sale.total;

      const day = new Date(sale.date.seconds * 1000)
        .toLocaleDateString();

      dailyMap[day] = (dailyMap[day] || 0) + sale.total;

      sale.items.forEach((item) => {
        productCount += item.quantity;
        productMap[item.name] =
          (productMap[item.name] || 0) + item.quantity;
      });
    });

    setTotalEarnings(earnings);
    setTotalProducts(productCount);

    // 🔥 Top products
    const sortedProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setTopProducts(sortedProducts);

    // 📈 Chart data
    const chart = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      total,
    }));

    setChartData(chart);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Dashboard (All Time)</h1>

      {/* 🔥 Date Picker */}
      <div style={{ marginBottom: "20px" }}>
        <label>From: </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label style={{ marginLeft: "10px" }}>To: </label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button onClick={fetchSales} style={{ marginLeft: "10px" }}>
          Apply
        </button>

        <button
          onClick={() => {
            setFromDate("");
            setToDate("");
            fetchSales();
          }}
          style={{ marginLeft: "10px" }}
        >
          Reset (All Time)
        </button>
      </div>

      {/* 💰 Stats */}
      <h2>💰 Earnings: ₱{totalEarnings}</h2>
      <h2>📦 Products Sold: {totalProducts}</h2>

      {/* 📈 Chart */}
      <h2>📈 Sales Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      {/* 🔥 Top Products */}
      <h2>🔥 Top Products</h2>
      <ul>
        {topProducts.map(([name, qty]) => (
          <li key={name}>
            {name} — {qty} sold
          </li>
        ))}
      </ul>
    </div>
  );
}
