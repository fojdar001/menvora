import "./Footer.css";
import { Link } from "react-router-dom"; // Dynamic client-side routing ke liye link import kiya
import {
  FaInstagram,
  FaWhatsapp,
  FaFacebook,
  FaShieldAlt,
  FaCreditCard,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        
        {/* BRAND */}
        <div className="footerBrand">
          <h2>MENVORA</h2>
          <p>
            Premium Ayurvedic wellness formula crafted for energy,
            confidence & daily vitality.
          </p>
          <div className="socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://wa.me/yournumber" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
          </div>
        </div>

        {/* LINKS */}
        <div className="footerLinks">
          <h3>Quick Links</h3>
          {/* Landing page sections ke anchor exact point karenge root par */}
          <a href="/#home">Home</a>
          <a href="/#benefits">Benefits</a>
          <a href="/#packages">Packages</a>
          <a href="/#reviews">Reviews</a>
          <a href="/#faq">FAQ</a>
        </div>

        {/* SUPPORT & POLICIES (UPDATED WITH CORRECT ROUTES) */}
        <div className="footerLinks">
          <h3>Support</h3>
          <Link to="/contact">Contact Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/terms-conditions">Terms & Conditions</Link>
        </div>

        {/* SECURITY */}
        <div className="footerSecurity">
          <h3>Secure Checkout</h3>
          <div className="secureBox">
            <FaShieldAlt />
            <span>100% Safe & Secure Payments</span>
          </div>
          <div className="secureBox">
            <FaCreditCard />
            <span>All Payment Methods Accepted</span>
          </div>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footerBottom">
        <p>© 2026 Menvora. All Rights Reserved.</p>
      </div>
    </footer>
  );
}