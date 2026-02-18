import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddProduct from "./pages/AddProduct";
import POS from "./pages/POS";
import ProductList from "./pages/ProductList";
import Receipt from "./pages/Receipt";
import ReceiptList from "./pages/ReceiptList";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ConnectionStatus from "./components/ConnectionStatus";
import { offlineStorage } from "./services/offlineStorage";

// Initialize offline storage
offlineStorage.init().catch(console.error);

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="pos-app-shell">
          <Navbar />
          <main className="pos-main">
            <Routes>
              <Route path="/" element={<AddProduct />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/receipts" element={<ReceiptList />} />
              <Route path="/receipt/:id" element={<Receipt />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cart" element={<Cart />} />
            </Routes>
          </main>
          <PWAInstallPrompt />
          <ConnectionStatus />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}
