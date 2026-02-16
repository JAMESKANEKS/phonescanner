import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div style={{ background: "#222", padding: "10px" }}>
      <Link to="/" style={{ color: "white", marginRight: "20px" }}>
        Add Product
      </Link>

      <Link to="/pos" style={{ color: "white" }}>
        POS
      </Link>
    </div>
  );
}
