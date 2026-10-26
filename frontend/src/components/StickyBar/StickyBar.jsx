import "./StickyBar.css";
import { FaBolt, FaStar, FaPhoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function StickyBar() {
  const navigate = useNavigate();

  const defaultPackage = {
    id: "sticky-offer",
    packageName: "Menvora Ayurvedic Product",
    totalAmount: 999,
    price: "₹999",
  };

  const handleBuyClick = () => {
    const token = localStorage.getItem("menvora_token");

    if (!token) {
      // TOKEN NAHI HAI -> SEEDHA LOGIN PAGE PAR REDIRECT KARO
      navigate("/login", { state: { redirectTo: "/checkout", packageData: defaultPackage } });
    } else {
      // LOGGED IN HAI -> CHECKOUT PAR BEJO
      navigate("/checkout", { state: defaultPackage });
    }
  };

  return (
    <div className="stickyBar">
      <div className="stickyLeft">
        <img src="/images/product/bottle.png" alt="Menvora" />
        <div className="stickyInfo">
          <h3>Menvora</h3>
          <div className="stickyRating">
            <FaStar />
            <span>4.9</span>
          </div>
        </div>
      </div>

      <div className="stickyPrice">
        <small>Limited Offer</small>
        <h2>₹999</h2>
      </div>

      <div className="stickyButtons">
        <button className="greenBtn" onClick={handleBuyClick}>
          <FaBolt /> BUY NOW
        </button>
        <a href="tel:+919211881387" className="callBtn">
          <FaPhoneAlt /> CALL
        </a>
      </div>
    </div>
  );
}