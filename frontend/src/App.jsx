import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Contact from "./pages/Contact";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsConditions from "./pages/TermsConditions";

export default function App() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      /* Meta Pixel & GA4 Code */
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Landing / Home Route */}
        <Route path="/" element={<Home />} />

        {/* Redirect /login directly to /checkout */}
        <Route path="/login" element={<Navigate to="/checkout" replace />} />

        {/* Direct Checkout Route (No Token / OTP Gate) */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Supporting Routes */}
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />

        {/* Wildcard Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}