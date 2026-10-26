import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

import {
  FaLeaf,
  FaShieldAlt,
  FaTruck,
  FaStar,
  FaBolt,
  FaClock,
  FaUsers,
} from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(
    8 * 60 * 60 + 42 * 60 + 18
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 8 * 60 * 60 + 42 * 60 + 18;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const handleBuyNow = () => {
    const token = localStorage.getItem("menvora_token");
    if (!token) {
      // Token nahi hai toh seedha login page par redirect karo
      navigate("/login");
    } else {
      // Token hai toh checkout par bhejo
      navigate("/checkout");
    }
  };

  return (
    <section className="hero" id="home">
      <div className="hero-bg-circle hero-circle-1"></div>
      <div className="hero-bg-circle hero-circle-2"></div>

      <div className="container heroGrid">
        {/* LEFT CONTENT */}
        <div className="heroContent">
          <div className="heroBadge">
            <FaStar />
            Trusted By 10,000+ Happy Customers
          </div>

          <h1>
            Feel More Active.
            <span>Feel More Confident.</span>
          </h1>

          <p>
            Premium Ayurvedic wellness tablets made with powerful herbal ingredients to naturally support men's daily vitality and confidence.
          </p>

          {/* FEATURES */}
          <div className="heroFeatures">
            <div>
              <FaLeaf />
              <span>100% Herbal Formula</span>
            </div>
            <div>
              <FaShieldAlt />
              <span>Secure Payment</span>
            </div>
            <div>
              <FaTruck />
              <span>Free Shipping</span>
            </div>
          </div>

          {/* COMBINED PRICE & TIMER ROW */}
          <div className="heroActionRow">
            <div className="priceCard">
              <small>Limited Time Offer</small>
              <div className="priceFlex">
                <span className="oldPrice">₹1599</span>
                <h2>₹999</h2>
              </div>
            </div>

            <div className="offerTimer">
              <div className="timerLabel">
                <FaClock />
                <span>Offer Ends In</span>
              </div>
              <strong>
                {hours} : {minutes} : {seconds}
              </strong>
            </div>
          </div>

          {/* BUY BUTTON */}
          <button
            className="greenBtn"
            onClick={handleBuyNow}
          >
            <FaBolt />
            BUY NOW
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="heroImage">
          <div className="imageGlow"></div>

          <div className="discountBadge">
            SAVE
            <strong>38%</strong>
          </div>

          <img
            src="/images/product/menvora3.png"
            alt="Menvora"
            className="product-image"
          />

          <div className="floatingCard ratingCard">⭐ 4.9 Rating</div>
          <div className="floatingCard herbalCard">🌿 100% Herbal</div>
          <div className="floatingCard liveCard">
            <FaUsers />
            37 People Viewing
          </div>
        </div>
      </div>

      {/* TRUST STRIP */}
      <ul className="heroTrust">
        <li>🚚 Free Shipping</li>
        <li>💳 Secure Payment</li>
        <li>🌿 100% Herbal</li>
        <li>⭐ 4.9 Rating</li>
        <li>💰 Cash On Delivery</li>
      </ul>
    </section>
  );
}