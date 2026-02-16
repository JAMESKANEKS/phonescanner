import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div style={{ background: "#222", padding: "10px" }}>
      <Link to="/" style={{ color: "white", marginRight: "20px" }}>
        Add Product
      </Link>

      <Link to="/pos" style={{ color: "white", marginRight: "20px" }}>
        POS
      </Link>

      <Link to="/products" style={{ color: "white", marginRight: "20px" }}>
      Product List
      </Link>

      <Link to="/receipts" style={{ color: "white" }}>Receipts</Link>
    </div>
  );
}
