import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

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

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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

        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              fontSize: "11px",
              color: "#9fb4ff",
              textAlign: "right",
              lineHeight: "1.2"
            }}>
              <div style={{ color: "#7b8197" }}>Logged in as</div>
              <div>{currentUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255, 77, 106, 0.1)",
                border: "1px solid rgba(255, 77, 106, 0.3)",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "11px",
                color: "#ff6b8a",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                transition: "all 0.15s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 77, 106, 0.2)";
                e.target.style.borderColor = "rgba(255, 77, 106, 0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 77, 106, 0.1)";
                e.target.style.borderColor = "rgba(255, 77, 106, 0.3)";
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
