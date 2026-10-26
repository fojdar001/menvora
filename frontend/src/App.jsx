import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Contact from "./pages/Contact";
import Login from "./pages/Login"; // Standalone Login Page (optional)

import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsConditions from "./pages/TermsConditions";

// Protected Route Guard
const ProtectedCheckout = ({ children }) => {
  const token = localStorage.getItem("menvora_token");
  
  if (!token) {
    // Agar user logged in nahi hai aur direct /checkout open karta hai,
    // toh use Home page (/) par bhej do taaki wo modal dwara login kar sake.
    return <Navigate to="/" replace />;
  }
  
  return children;
};

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
        
        {/* Dedicated Login Route (agar alag page par bhej rahe hain) */}
        <Route path="/login" element={<Login />} />

        {/* Protected Checkout Route */}
        <Route
          path="/checkout"
          element={
            <ProtectedCheckout>
              <Checkout />
            </ProtectedCheckout>
          }
        />
        
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