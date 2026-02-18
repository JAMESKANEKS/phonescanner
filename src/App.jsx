import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AddProduct from "./pages/AddProduct";
import POS from "./pages/POS";
import ProductList from "./pages/ProductList";
import Receipt from "./pages/Receipt";
import ReceiptList from "./pages/ReceiptList";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { offlineStorage } from "./services/offlineStorage";

// Initialize offline storage
offlineStorage.init().catch(console.error);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<ProductList />} />
            <Route path="receipts" element={<ReceiptList />} />
            <Route path="receipt/:id" element={<Receipt />} />
            <Route path="cart" element={<Cart />} />
            <Route index element={<AddProduct />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <CartProvider>
      <div className="pos-app-shell">
        <Navbar />
        <main className="pos-main">
          <Outlet />
        </main>
      </div>
    </CartProvider>
  );
}

export default App;
