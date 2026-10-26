import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const BACKEND_URL = "https://menvora-backend.vercel.app";

export default function Login({ isOpen = true, onClose, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  if (isOpen === false) return null;

  // 1. Send OTP Request
  const handleSendOtp = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "OTP generated successfully!");
        
        if (data.devOtp) {
          toast.info(`Development / Test OTP: ${data.devOtp}`, { autoClose: 10000 });
        }
        
        setStep("otp");
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("OTP Send Error:", error);
      toast.error("Unable to connect to server. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Request & Guaranteed Redirect
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cleanOtp = otp.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (cleanOtp.length < 4) {
      toast.error("Please enter valid OTP code!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Token aur phone details localStorage me securely save karein
        if (data.token) localStorage.setItem("menvora_token", data.token);
        localStorage.setItem("menvora_phone", cleanPhone);
        localStorage.setItem("menvora_user_phone", cleanPhone);

        window.dispatchEvent(new Event("storage"));

        toast.success("Phone Verified Successfully!");

        if (onSuccess) onSuccess(cleanPhone);
        if (onClose) onClose();

        // Safe Navigation Data
        const incomingState = location.state || {};
        const packageData = incomingState.packageData || incomingState || null;

        // 🚀 CRITICAL FIX: Chhota sa delay taaki token localStorage me properly lock ho jaye
        setTimeout(() => {
          if (packageData && packageData.totalAmount) {
            navigate("/checkout", { state: packageData, replace: true });
          } else {
            navigate("/checkout", { replace: true });
          }
        }, 150);

      } else {
        toast.error(data.message || "Invalid OTP code. Try 1234");
      }
    } catch (error) {
      console.error("Verify Error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={() => onClose && onClose()}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #18181b, #09090b)",
          border: "1px solid #27272a",
          borderRadius: "20px",
          padding: "36px 28px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          color: "#ffffff",
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "#27272a",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#a1a1aa",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        )}

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span
            style={{
              color: "#d97706",
              fontSize: "0.8rem",
              letterSpacing: "2px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            Menvora Ayurveda
          </span>
          <h3
            style={{
              fontSize: "1.6rem",
              fontWeight: "700",
              marginTop: "4px",
              marginBottom: "6px",
              color: "#f4f4f5",
            }}
          >
            {step === "phone" ? "Welcome Back" : "Enter Verification Code"}
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.875rem", margin: 0 }}>
            {step === "phone"
              ? "Enter mobile number to receive WhatsApp OTP"
              : `Code sent to WhatsApp +91 ${phone}`}
          </p>
        </div>

        {step === "phone" ? (
          <form
            onSubmit={handleSendOtp}
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "#d4d4d8",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Mobile Number
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#71717a",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 50px",
                    borderRadius: "10px",
                    background: "#09090b",
                    border: "1px solid #3f3f46",
                    color: "#ffffff",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: loading
                  ? "#27272a"
                  : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending WhatsApp OTP..." : "Get Verification Code"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "#d4d4d8",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Verification OTP
              </label>
              <input
                type="text"
                maxLength="4"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#09090b",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  fontSize: "1.2rem",
                  letterSpacing: "6px",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: loading
                  ? "#27272a"
                  : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verifying..." : "Verify & Proceed to Checkout"}
            </button>

            <button
              type="button"
              onClick={() => setStep("phone")}
              style={{
                background: "transparent",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              ← Edit Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}