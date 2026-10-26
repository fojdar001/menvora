import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHome } from "react-icons/fa";
import "../components/OrderSuccess/OrderSuccess.css";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const paymentId = location.state?.paymentId || "COD_ORDER";
  const totalAmount = location.state?.totalAmount || 999; 
  const packageName = location.state?.packageName || "Menvora Wellness Tablets";

  useEffect(() => {
    // Browser native Meta Pixel Purchase Trigger
    if (typeof window !== "undefined" && window.fbq) {
      try {
        window.fbq("track", "Purchase", {
          value: totalAmount,
          currency: "INR",
          content_name: packageName,
          content_type: "product",
        });
        console.log("🔥 Meta Purchase Tracked successfully via Window for:", totalAmount);
      } catch (error) {
        console.error("Meta Pixel purchase tracking failed:", error);
      }
    }
  }, [totalAmount, packageName]);

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="animation-wrapper">
          <div className="loading-circle"></div>
          <FaCheckCircle className="animated-tick" />
        </div>

        <h2>Order Placed Successfully!</h2>
        <p className="thank-you">Thank you for shopping with Menvora Wellness.</p>
        
        <div className="order-details-box">
          <p><strong>Payment Mode / ID:</strong></p>
          <span>{paymentId}</span>
        </div>

        <button onClick={() => navigate("/")} className="home-btn">
          <FaHome /> Continue Shopping
        </button>
      </div>
    </div>
  );
}