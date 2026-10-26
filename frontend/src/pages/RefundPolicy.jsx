import { useState, useEffect } from "react";
import { FaBolt, FaUndo, FaCheckCircle, FaHandHoldingHeart } from "react-icons/fa"; // Premium Icons
import "../components/RefundPolicy/RefundPolicy.css"; 

export default function RefundPolicy() {
  const [loading, setLoading] = useState(true);

  // --- PAGE LOAD EFFORTLESS TRANSITION LOGIC ---
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1200); // Perfect luxury transition timing
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return (
    <>
      {/* 🌟 LUXURY CORE MINIMALIST SCREEN LOCK SPINNER 🌟 */}
      {loading && (
        <div className="menvora-preloader-overlay">
          <div className="luxury-center-spinner">
            <div className="luxury-track-ring"></div>
            <div className="luxury-active-glow"></div>
            <FaBolt className="luxury-bolt-core" />
          </div>
        </div>
      )}

      {/* REFUND POLICY MAIN CONTENT CONTAINER */}
      <section className="refund-section">
        <div className="refund-header">
          <h2>Cancellation & Refund Policy</h2>
          <p>Last updated: July 2026</p>
          <p className="refund-sub-desc">
            We want you to be completely satisfied with your Menvora experience. 
            Please review our transparent policy regarding order cancellations and refund timelines.
          </p>
        </div>

        {/* TRUST BADGES */}
        <div className="refund-badges-container">
          <div className="refund-badge">
            <FaUndo />
            <span>Easy Returns</span>
          </div>
          <div className="refund-badge">
            <FaCheckCircle />
            <span>Transparent Process</span>
          </div>
          <div className="refund-badge">
            <FaHandHoldingHeart />
            <span>100% Customer Care</span>
          </div>
        </div>

        {/* POLICY CONTENT CARD */}
        <div className="refund-content-card">
          <div className="policy-block">
            <h3>1. Order Cancellations</h3>
            <p>
              Aap apna order ship hone se pehle kisi bhi waqt cancel kar sakte hain. Ek baar agar order hamare warehouse se dispatch (ship) ho gaya, toh security aur product integrity ke chalte use cancel nahi kiya ja sakega. Cancelled orders ka refund immediate process ho jata hai.
            </p>
          </div>

          <div className="policy-block">
            <h3>2. Damaged or Wrong Products</h3>
            <p>
              Agar aapko koi damaged, broken, ya wrong product receive hota hai, toh delivery ke <strong>48 hours</strong> ke andar hamari support team ko contact karein. Proof ke liye unboxing video ya pictures zaroori hain. Verify hone ke baad hum bina kisi extra charge ke aapka replacement order dispatch kar denge.
            </p>
          </div>

          <div className="policy-block">
            <h3>3. Refund Timelines</h3>
            <p>
              Prepaid orders (UPI, Card, NetBanking) ka refund direct aapke original payment source me credit kiya jata hai. Refund initiated hone ke baad bank processing me aamtaur par <strong>5 to 7 working days</strong> ka samay lagta hai.
            </p>
          </div>

          <div className="policy-block">
            <h3>4. Cash on Delivery (COD) Refunds</h3>
            <p>
              COD orders ke mamle me refund direct bank account transfer ya UPI ke zariya diya jata hai. Humari verification team aapse valid bank details collect karegi aur successful verification ke 48 hours ke andar payout process kar diya jayega.
            </p>
          </div>

          <div className="policy-block">
            <h3>5. Non-Refundable Scenarios</h3>
            <p>
              Khuli hui bottles, partial consumed products, ya delivery ke 7 din baad raise ki gayi complaints standard hygiene protocols ke mutabik policy ke andar cover nahi ki jaati hain.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}