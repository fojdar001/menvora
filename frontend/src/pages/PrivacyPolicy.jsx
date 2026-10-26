import { useState, useEffect } from "react";
import { FaBolt, FaLock, FaEye, FaUserShield } from "react-icons/fa"; // Premium Icons
import "../components/PrivacyPolicy/PrivacyPolicy.css"; 

export default function PrivacyPolicy() {
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

      {/* PRIVACY POLICY MAIN CONTENT CONTAINER */}
      <section className="privacy-section">
        <div className="privacy-header">
          <h2>Privacy Policy</h2>
          <p>Last updated: July 2026</p>
          <p className="privacy-sub-desc">
            At Menvora, we value your trust and are committed to protecting your personal data. 
            This policy outlines how we collect, use, and safeguard your information.
          </p>
        </div>

        {/* TRUST BADGES */}
        <div className="privacy-badges-container">
          <div className="privacy-badge">
            <FaLock />
            <span>100% Encrypted</span>
          </div>
          <div className="privacy-badge">
            <FaEye />
            <span>Zero Data Leak</span>
          </div>
          <div className="privacy-badge">
            <FaUserShield />
            <span>GDPR Compliant</span>
          </div>
        </div>

        {/* POLICY CONTENT CARD */}
        <div className="privacy-content-card">
          <div className="policy-block">
            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us when placing an order or contacting us. 
              This includes your full name, mobile number, email address, shipping address, and payment preferences.
            </p>
          </div>

          <div className="policy-block">
            <h3>2. How We Use Your Data</h3>
            <p>
              Your data is primarily used to process orders, manage secure transactions via Razorpay, 
              provide dynamic order updates, and respond directly to queries submitted through our Contact Support system.
            </p>
          </div>

          <div className="policy-block">
            <h3>3. Payment & Security</h3>
            <p>
              We do not store your credit card or UPI details on our servers. All financial transactions are 
              processed through Razorpay's end-to-end encrypted payment gateway adhering to strict PCI-DSS safety metrics.
            </p>
          </div>

          <div className="policy-block">
            <h3>4. Cookies & Tracking</h3>
            <p>
              Menvora uses subtle analytical cookies to enhance website navigation speed, personalize user sessions, 
              and track aggregate store performance without linking any direct identity metrics.
            </p>
          </div>

          <div className="policy-block">
            <h3>5. Contact Us</h3>
            <p>
              If you have any questions or serious inquiries regarding this privacy statement or data security compliance, 
              feel free to reach out to our team at <strong>support@menvora.com</strong>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}