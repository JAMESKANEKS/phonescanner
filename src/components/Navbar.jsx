import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <header className="navbar-header">
      <div className="navbar-brand">
        <div className="navbar-logo" />
        <div className="navbar-brand-text">
          <div className="navbar-title">Phone Scanner</div>
          <div className="navbar-subtitle">Smart POS Terminal</div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button 
        className="navbar-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
      </button>

      <div className={`navbar-content ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav className="navbar-nav">
          <Link to="/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Add Product
          </Link>
          <Link to="/pos" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            POS
          </Link>
          <Link to="/cart" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Cart
          </Link>
          <Link to="/receipts" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Receipts
          </Link>
          <Link to="/products" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>
        </nav>

        {currentUser && (
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-label">Logged in as</div>
              <div className="navbar-user-email">{currentUser.email}</div>
            </div>
            <button className="navbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
