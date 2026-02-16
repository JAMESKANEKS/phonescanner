import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddProduct from "./pages/AddProduct";
import POS from "./pages/POS";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<AddProduct />} />
          <Route path="/pos" element={<POS />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
