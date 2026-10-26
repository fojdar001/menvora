import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Stats from "../components/Stats/Stats";
import VideoSection from "../components/VideoSection/VideoSection";
import Benefits from "../components/Benefits/Benefits";
import Packages from "../components/Packages/Packages";
import BeforeAfter from "../components/BeforeAfter/BeforeAfter";
import Reviews from "../components/Reviews/Reviews";
import FAQ from "../components/FAQ/FAQ";
import StickyBar from "../components/StickyBar/StickyBar";
import WhatsAppFloat from "../components/WhatsAppFloat/WhatsAppFloat";
import Footer from "../components/Footer/Footer";

// ✅ FIXED IMPORT PATH (Same folder import)
import LoginModal from "./Login";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBolt } from "react-icons/fa";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState(null);

  const navigate = useNavigate();

  // --- PERFECT SMOOTH LOAD CONTROLLER ---
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  // --- BUY NOW CLICK GUARD FUNCTION ---
  const handleBuyNow = (packageData) => {
    const token = localStorage.getItem("menvora_token");

    if (!token) {
      setPendingPackage(packageData);
      setShowLoginModal(true);
    } else {
      navigate("/checkout", { state: packageData });
    }
  };

  // --- OTP VERIFICATION SUCCESS HANDLER ---
  const handleLoginSuccess = (userPhone) => {
    setShowLoginModal(false);

    if (pendingPackage) {
      navigate("/checkout", { state: { ...pendingPackage, userPhone } });
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      {/* PRELOADER OVERLAY */}
      {loading && (
        <div className="menvora-preloader-overlay">
          <div className="luxury-center-spinner">
            <div className="luxury-track-ring"></div>
            <div className="luxury-active-glow"></div>
            <FaBolt className="luxury-bolt-core" />
          </div>
        </div>
      )}

      {/* LOGIN OTP MODAL OVERLAY */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* MAIN NAVBAR */}
      <Navbar onLoginClick={() => setShowLoginModal(true)} onBuyNow={handleBuyNow} />

      <main>
        {/* HERO */}
        <section id="home">
          <Hero onBuyNow={handleBuyNow} />
        </section>

        {/* STATS */}
        <section id="stats">
          <Stats />
        </section>

        {/* PACKAGES */}
        <section id="packages">
          <Packages onBuyNow={handleBuyNow} />
        </section>

        {/* BEFORE & AFTER */}
        <section id="results">
          <BeforeAfter />
        </section>

        {/* VIDEO SECTION */}
        <section id="videos">
          <VideoSection />
        </section>

        {/* BENEFITS */}
        <section id="benefits">
          <Benefits />
        </section>

        {/* REVIEWS */}
        <section id="reviews">
          <Reviews />
        </section>

        {/* FAQ */}
        <section id="faq">
          <FAQ />
        </section>
      </main>

      {/* STICKY BUY BAR & WHATSAPP */}
      <StickyBar onBuyNow={handleBuyNow} />
      <WhatsAppFloat />

      {/* FOOTER */}
      <Footer />
    </>
  );
}