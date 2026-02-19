import { useEffect, useState, useCallback } from "react";
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
  const [totalUniqueProducts, setTotalUniqueProducts] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  // 🔥 Fetch total unique products
  const fetchTotalUniqueProducts = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      setTotalUniqueProducts(snapshot.size);
    } catch (error) {
      console.error("Error fetching total products:", error);
    }
  }, []);

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

  const fetchSales = useCallback(async () => {
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
  }, [fromDate, toDate]);

  // 🔥 Fetch ALL sales on first load
  useEffect(() => {
    setTimeout(() => {
      fetchSales();
      fetchTotalUniqueProducts();
    }, 0);
  }, [fetchSales, fetchTotalUniqueProducts]);

  return (
    <div>
      <h1 className="pos-page-title">Analytics</h1>

      {/* 🔥 Date Picker */}
      <div className="pos-card">
        <div className="pos-card-header">
          <span>Sales window</span>
        </div>
        <div className="pos-layout-row">
          <div style={{ minWidth: 160 }}>
            <div className="pos-label">From</div>
            <input
              className="pos-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <div className="pos-label">To</div>
            <input
              className="pos-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button className="pos-button" onClick={fetchSales}>
              Apply
            </button>
            <button
              className="pos-button-secondary"
              onClick={() => {
                setFromDate("");
                setToDate("");
                fetchSales();
              }}
            >
              Reset (All Time)
            </button>
          </div>
        </div>
      </div>

      <div className="pos-layout-row pos-mt-lg">
        {/* 💰 Stats */}
        <div style={{ flex: "1 1 260px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Overview</span>
            </div>
            <p>💰 Earnings: ₱{totalEarnings}</p>
            <p>📦 Products Sold: {totalProducts}</p>
            <p>🏪 Products in Inventory: {totalUniqueProducts}</p>
          </div>
        </div>

        {/* 📈 Chart */}
        <div style={{ flex: "2 1 420px" }}>
          <div className="pos-card">
            <div className="pos-card-header">
              <span>Sales chart</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#333b52" />
                <XAxis dataKey="date" stroke="#a4b0d5" />
                <YAxis stroke="#a4b0d5" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#36c2ff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🔥 Top Products */}
      <div className="pos-card pos-mt-lg">
        <div className="pos-card-header">
          <span>Top products</span>
        </div>
        <ul>
          {topProducts.map(([name, qty]) => (
            <li key={name}>
              {name} — {qty} sold
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
