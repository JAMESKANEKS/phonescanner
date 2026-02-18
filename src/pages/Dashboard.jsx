import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "sales"));

      let todayTotal = 0;
      let todayCount = 0;

      const today = new Date().toDateString();

      const earningsByDay = {};
      const productCount = {};

      snapshot.forEach((doc) => {
        const sale = doc.data();

        if (!sale.date) return;

        const saleDate = sale.date.toDate();
        const day = saleDate.toDateString();

        // 🔹 Daily earnings
        if (day === today) {
          todayTotal += sale.total;
          todayCount++;
        }

        // 🔹 Chart data (earnings per day)
        earningsByDay[day] = (earningsByDay[day] || 0) + sale.total;

        // 🔹 Top selling products
        sale.items.forEach((item) => {
          productCount[item.name] =
            (productCount[item.name] || 0) + item.quantity;
        });
      });

      setDailyEarnings(todayTotal);
      setTodayTransactions(todayCount);

      // 🔹 Convert earnings to chart format
      const chart = Object.keys(earningsByDay).map((day) => ({
        day,
        earnings: earningsByDay[day],
      }));

      setChartData(chart);

      // 🔹 Top products sorted
      const sortedProducts = Object.entries(productCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Advanced Dashboard</h1>

      {/* DAILY EARNINGS */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ padding: "20px", background: "#eee" }}>
          <h3>Today's Earnings</h3>
          <h2>₱{dailyEarnings}</h2>
        </div>

        <div style={{ padding: "20px", background: "#eee" }}>
          <h3>Today's Transactions</h3>
          <h2>{todayTransactions}</h2>
        </div>
      </div>

      {/* SALES CHART */}
      <h2 style={{ marginTop: "40px" }}>Sales Chart</h2>

      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="earnings" stroke="#8884d8" />
      </LineChart>

      {/* TOP SELLING PRODUCTS */}
      <h2 style={{ marginTop: "40px" }}>Top Selling Products</h2>

      <ul>
        {topProducts.map((p, i) => (
          <li key={i}>
            {p.name} — Sold: {p.qty}
          </li>
        ))}
      </ul>
    </div>
  );
}
