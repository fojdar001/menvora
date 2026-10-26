import "./Navbar.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPhone, setUserPhone] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("menvora_token");
    const phone = localStorage.getItem("menvora_phone") || localStorage.getItem("menvora_user_phone");
    if (token && phone) {
      setUserPhone(phone);
    }
  }, []);

  const handleBuyNowClick = (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("menvora_token");

    if (!token) {
      // TOKEN NAHI HAI -> SEEDHA LOGIN PAGE PAR BEJO
      navigate("/login");
    } else {
      // TOKEN HAI -> CHECKOUT PAGE PAR BEJO
      navigate("/checkout");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("menvora_token");
    localStorage.removeItem("menvora_phone");
    localStorage.removeItem("menvora_user_phone");
    setUserPhone(null);
    window.location.reload();
  };

  return (
    <>
      <div className="topBar">
        <div className="marquee">
          <div className="marquee-content">
            🌿 100% Ayurvedic Formula <span>•</span> 🚚 Free Shipping Across India <span>•</span> ⭐ 10,000+ Happy Customers <span>•</span> 💳 Cash On Delivery <span>•</span> 🔒 Secure Payment
          </div>
        </div>
      </div>

      <header className="navbar">
        <div className="container nav-container">
          <Link to="/" className="logo">
            MEN<span>VORA</span>
          </Link>

          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#benefits">Benefits</a>
            <a href="#packages">Packages</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {userPhone && (
              <div className="user-badge" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "14px" }}>
                <FaUser />
                <span>{userPhone.slice(-4)}</span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{ background: "transparent", border: "none", color: "#ff4d4d", cursor: "pointer" }}
                >
                  <FaSignOutAlt />
                </button>
              </div>
            )}

            <button onClick={handleBuyNowClick} className="buy-btn" style={{ border: "none", cursor: "pointer" }}>
              <FaShoppingCart />
              Buy Now
            </button>
          </div>

          <div className="menuIcon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </header>

      <div className={`mobileMenu ${menuOpen ? "showMenu" : ""}`}>
        <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="#benefits" onClick={() => setMenuOpen(false)}>Benefits</a>
        <a href="#packages" onClick={() => setMenuOpen(false)}>Packages</a>
        <a href="#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
        <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>

        <button
          className="mobileBuy"
          onClick={(e) => {
            setMenuOpen(false);
            handleBuyNowClick(e);
          }}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <FaShoppingCart />
          Buy Now
        </button>
      </div>
    </>
  );
}