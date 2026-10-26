import { useState, useEffect } from "react";
import { FaBolt, FaGavel, FaFileContract, FaUserCheck } from "react-icons/fa"; // Premium Icons
import "../components/TermsConditions/TermsConditions.css";

export default function TermsConditions() {
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

      {/* TERMS & CONDITIONS MAIN CONTENT CONTAINER */}
      <section className="terms-section">
        <div className="terms-header">
          <h2>Terms & Conditions</h2>
          <p>Last updated: July 2026</p>
          <p className="terms-sub-desc">
            Welcome to Menvora. By accessing our website and purchasing our premium formulas, 
            you agree to abide by the following comprehensive terms and governance rules.
          </p>
        </div>

        {/* TRUST BADGES */}
        <div className="terms-badges-container">
          <div className="terms-badge">
            <FaGavel />
            <span>Legal Compliance</span>
          </div>
          <div className="terms-badge">
            <FaFileContract />
            <span>Fair Usage</span>
          </div>
          <div className="terms-badge">
            <FaUserCheck />
            <span>Authorized Buyer</span>
          </div>
        </div>

        {/* POLICY CONTENT CARD */}
        <div className="terms-content-card">
          <div className="policy-block">
            <h3>1. Acceptance of Terms</h3>
            <p>
              Menvora website use karke ya order place karke aap hamari terms aur policies ko accept karte hain. Agar aap in terms se sahmat nahi hain, toh aap hamari services use nahi kar sakte. Hum kisi bhi waqt in terms ko modify karne ka right rakhte hain.
            </p>
          </div>

          <div className="policy-block">
            <h3>2. Product Usage & Medical Disclaimer</h3>
            <p>
              Menvora ke products premium Ayurvedic ingredients se bane hain. Website par di gayi jankari sirf informational purpose ke liye hai aur ye kisi professional medical advice ka substitute nahi hai. Kisi bhi pre-existing health condition ke mamle me use karne se pehle doctor se consult zaroori hai.
            </p>
          </div>

          <div className="policy-block">
            <h3>3. Pricing & Order Acceptance</h3>
            <p>
              Hum bina kisi prior notice ke products ke prices badalne ka right rakhte hain. Kisi bhi mechanical error, stock issues, ya galat pricing display hone par hum kisi bhi order ko cancel ya refuse karne ka adhikaar rakhte hain (chahe aapka payment source hit hi kyu na ho gaya ho, jiska poora refund mil jayega).
            </p>
          </div>

          <div className="policy-block">
            <h3>4. Account & Payment Security</h3>
            <p>
              Aap apne order details (Name, Address, Phone Number) bilkul correct fill karne ke liye bound hain. Kisi bhi fraudulent transaction ya unauthorized gateway testing paye jaane par hum strict measures lene aur order instantly void karne ke liye responsive hain.
            </p>
          </div>

          <div className="policy-block">
            <h3>5. Intellectual Property</h3>
            <p>
              Menvora website par maujood saara content, text, designs, layout graphics, aur custom coding core exclusive property hain. Iska koi bhi unauthorized commercial reuse ya cloning legal action ke under subject kiya jayega.
            </p>
          </div>

          <div className="policy-block">
            <h3>6. Governing Law</h3>
            <p>
              In terms aur rules se uthne wale kisi bhi disputes ya claims ka jurisdiction completely local laws aur state regulations ke under valid mana jayega. Kisi bhi legal query ke liye aap hume <strong>support@menvora.com</strong> par directly approach kar sakte hain.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}