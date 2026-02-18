import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        background:
          "radial-gradient(circle at top left, #1f2635 0, #090c11 60%, #05060a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            background:
              "conic-gradient(from 200deg, #1fe6a8, #0fb4ff, #1fe6a8)",
            boxShadow: "0 0 12px rgba(0,255,255,0.45)",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9fb3ff",
            }}
          >
            Phone Scanner
          </div>
          <div style={{ fontSize: 11, color: "#7b8197" }}>
            Smart POS Terminal
          </div>
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        <Link to="/dashboard" style={{ color: "#e4ebff", textDecoration: "none"  }}>
          | Dashboard |
        </Link>
        <Link to="/" style={{ color: "#e4ebff", textDecoration: "none"  }}>
          | Add Product |
        </Link>
        <Link to="/pos" style={{ color: "#e4ebff", textDecoration: "none"  }}>
          | POS |
        </Link>
        <Link to="/cart" style={{ color: "#e4ebff", textDecoration: "none" }}>
          | Cart |
        </Link>
        <Link to="/receipts" style={{ color: "#e4ebff", textDecoration: "none"  }}>
          | Receipts |
        </Link>
        <Link to="/products" style={{ color: "#e4ebff", textDecoration: "none"  }}>
          | Products |
        </Link>
      </nav>
    </header>
  );
}
