import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div style={{ background: "#222", padding: "10px" }}>

      <Link to="/dashboard" style={{ color: "white", marginRight: "15px" }}>
       Dashboard
      </Link>
      <Link to="/" style={{ color: "white", marginRight: "20px" }}>
        Add Product
      </Link>

      <Link to="/pos" style={{ color: "white", marginRight: "20px" }}>
        POS
      </Link>
      <Link to="/cart" style={{ color: "white", marginRight: "15px" }}>Cart</Link>

      <Link to="/receipts" style={{ color: "white", marginRight: "15px" }}>Receipts</Link>

      <Link to="/products" style={{ color: "white", marginRight: "20px" }}>
      Product List
      </Link>
      
    </div>
  );
}
