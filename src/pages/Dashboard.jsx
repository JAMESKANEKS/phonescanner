import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserSales, getUserProducts } from "../services/dataService";
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
  const { currentUser } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUniqueProducts, setTotalUniqueProducts] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  // 🔥 Fetch total unique products
  const fetchTotalUniqueProducts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const products = await getUserProducts(currentUser.uid);
      setTotalUniqueProducts(products.length);
    } catch (error) {
      console.error("Error fetching total products:", error);
      setError("Failed to load products");
    }
  }, [currentUser]);

  // 🔥 Calculate dashboard stats
  const calculateStats = (data) => {
    let earnings = 0;
    let productCount = 0;
    let productMap = {};
    let dailyMap = {};

    data.forEach((sale) => {
      earnings += sale.total;

      // Safe date handling for different formats
      let saleDate;
      if (sale.date instanceof Date) {
        saleDate = sale.date;
      } else if (sale.date?.seconds) {
        saleDate = new Date(sale.date.seconds * 1000);
      } else if (sale.date) {
        saleDate = new Date(sale.date);
      } else {
        saleDate = new Date();
      }

      const day = saleDate.toLocaleDateString();

      dailyMap[day] = (dailyMap[day] || 0) + sale.total;

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          productCount += item.quantity || 0;
          productMap[item.name] =
            (productMap[item.name] || 0) + (item.quantity || 0);
        });
      }
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
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      const sales = await getUserSales(currentUser.uid);
      
      // Filter by date if provided
      let filteredSales = sales;
      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        filteredSales = sales.filter((sale) => {
          let saleDate;
          if (sale.date instanceof Date) {
            saleDate = sale.date;
          } else if (sale.date?.seconds) {
            saleDate = new Date(sale.date.seconds * 1000);
          } else if (sale.date) {
            saleDate = new Date(sale.date);
          } else {
            return false;
          }
          
          return saleDate >= start && saleDate <= end;
        });
      }

      calculateStats(filteredSales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setError("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, [currentUser, fromDate, toDate]);

  // 🔥 Fetch ALL sales on first load
  useEffect(() => {
    if (currentUser) {
      fetchSales();
      fetchTotalUniqueProducts();
    }
  }, [currentUser, fetchSales, fetchTotalUniqueProducts]);

  return (
    <div>
      <h1 className="pos-page-title">Analytics</h1>

      {error && (
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
      )}

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
              disabled={loading}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <div className="pos-label">To</div>
            <input
              className="pos-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={loading}
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
            <button 
              className="pos-button" 
              onClick={fetchSales}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply'}
            </button>
            <button
              className="pos-button-secondary"
              onClick={() => {
                setFromDate("");
                setToDate("");
                fetchSales();
              }}
              disabled={loading}
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
            <p>💰 Earnings: ₱{totalEarnings.toFixed(2)}</p>
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
            {loading ? (
              <div style={{ 
                height: '260px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#aab2c5'
              }}>
                Loading chart data...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#333b52" />
                  <XAxis dataKey="date" stroke="#a4b0d5" />
                  <YAxis stroke="#a4b0d5" />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#36c2ff" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                height: '260px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#aab2c5'
              }}>
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 Top Products */}
      <div className="pos-card pos-mt-lg">
        <div className="pos-card-header">
          <span>Top products</span>
        </div>
        {topProducts.length > 0 ? (
          <ul>
            {topProducts.map(([name, qty]) => (
              <li key={name}>
                {name} — {qty} sold
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#aab2c5', textAlign: 'center', padding: '20px' }}>
            No product data available
          </p>
        )}
      </div>
    </div>
  );
}
