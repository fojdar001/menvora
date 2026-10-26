import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaMinus,
  FaPlus,
  FaMoneyBillWave,
  FaUniversity,
  FaCreditCard,
  FaBolt,
  FaLock,
  FaPhoneAlt,
} from "react-icons/fa";

import "../components/Checkout/Checkout.css";

const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || "https://menvora-backend.vercel.app"
).replace(/\/$/, "");
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY || "";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Address & Order

  // Auth Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Checkout State
  const [loading, setLoading] = useState(false);
  const [packageName, setPackageName] = useState("Menvora Wellness Tablets");
  const [productPrice, setProductPrice] = useState(999);
  const [quantity, setQuantity] = useState(1);
  const [isPackageSelected, setIsPackageSelected] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  // Check saved verification safely on load
  useEffect(() => {
    const token = localStorage.getItem("menvora_token");
    const savedPhone = localStorage.getItem("menvora_phone");

    if (token && savedPhone) {
      setPhone(savedPhone);
      setFormData((prev) => ({ ...prev, phone: savedPhone }));
      setStep(3); // Already verified -> Go straight to address form
    }
  }, []);

  // Update package details from router location state
  useEffect(() => {
    if (location.state?.amount) {
      setProductPrice(Number(location.state.amount));
      setPackageName(
        location.state.title
          ? `Menvora Combo (${location.state.title})`
          : "Menvora Ayurvedic Package"
      );
      setIsPackageSelected(true);
    }
  }, [location.state]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ==================== AUTH / OTP HANDLERS ====================

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number!");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep(2);
        toast.success(data.message || "OTP generated successfully!");
        if (data.devOtp) {
          toast.info(`Development OTP: ${data.devOtp}`, { autoClose: 10000 });
        }
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("OTP Send Error:", err);
      toast.error("Unable to connect to server. Check network connection.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    const cleanOtp = otp.trim();

    if (cleanOtp.length < 4) {
      toast.error("Please enter 4-digit OTP!");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Mobile number verified!");

        if (data.token) localStorage.setItem("menvora_token", data.token);
        localStorage.setItem("menvora_phone", cleanPhone);

        setFormData((prev) => ({ ...prev, phone: cleanPhone }));
        setStep(3); // Step 3: Direct Address Details
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP Verify Error:", err);
      toast.error("Verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ==================== PRICING CALCULATIONS ====================

  const subtotal = productPrice * quantity;
  const isOnlinePayment = paymentMethod === "upi" || paymentMethod === "card";
  const discount = isOnlinePayment ? Math.round(subtotal * 0.05) : 0;
  const shipping = 0;
  const total = subtotal - discount + shipping;

  const basePrice = Number((total / 1.05).toFixed(2));
  const gstAmount = Number((total - basePrice).toFixed(2));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Process COD Order
  const processCodOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("menvora_token");

      const orderData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim().replace(/\D/g, ""),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        landmark: formData.landmark ? formData.landmark.trim() : "",
        packageName,
        quantity,
        totalAmount: total,
        paymentMethod: "COD",
        paymentStatus: "Pending",
      };

      const res = await fetch(`${BACKEND_URL}/api/save-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const savedResData = await res.json();

      if (!res.ok || !savedResData.success) {
        throw new Error(savedResData.error || savedResData.message || "Failed to save order.");
      }

      const generatedBillNo = savedResData.billNo;
      const savedOrderId = savedResData.orderId;

      // Email Dispatch
      try {
        await fetch(`${BACKEND_URL}/api/send-confirmation-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderData,
            billNo: generatedBillNo,
            orderId: savedOrderId,
          }),
        });
      } catch (emailErr) {
        console.warn("Confirmation email error:", emailErr);
      }

      setLoading(false);
      navigate("/order-success", {
        replace: true,
        state: {
          paymentId: "COD",
          billNo: generatedBillNo,
          orderId: savedOrderId,
        },
      });
    } catch (err) {
      console.error("COD Order Error:", err);
      setLoading(false);
      toast.error(err.message || "Failed to place order.");
    }
  };

  const initRazorpayPayment = async () => {
    setLoading(true);
    const resLoaded = await loadRazorpayScript();

    if (!resLoaded) {
      toast.error("Razorpay SDK failed to load.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      const orderData = await response.json();

      if (!response.ok || !orderData.id) {
        throw new Error(orderData.message || "Failed to create payment order.");
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Menvora Ayurveda",
        description: `${packageName} x ${quantity}`,
        order_id: orderData.id,
        handler: async function (res) {
          try {
            const token = localStorage.getItem("menvora_token");
            const payload = {
              fullName: formData.fullName.trim(),
              phone: formData.phone.trim().replace(/\D/g, ""),
              email: formData.email.trim().toLowerCase(),
              address: formData.address.trim(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              pincode: formData.pincode.trim(),
              landmark: formData.landmark ? formData.landmark.trim() : "",
              packageName,
              quantity,
              totalAmount: total,
              paymentMethod,
              razorpayOrderId: orderData.id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            };

            const saveRes = await fetch(`${BACKEND_URL}/api/save-order`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });

            const saveData = await saveRes.json();

            if (!saveRes.ok || !saveData.success) {
              throw new Error(saveData.error || "Payment verification failed.");
            }

            try {
              await fetch(`${BACKEND_URL}/api/send-confirmation-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...payload,
                  paymentStatus: "Paid",
                  billNo: saveData.billNo,
                  orderId: saveData.orderId,
                }),
              });
            } catch (emailErr) {
              console.warn("Email dispatch error:", emailErr);
            }

            setLoading(false);
            navigate("/order-success", {
              replace: true,
              state: {
                paymentId: res.razorpay_payment_id,
                billNo: saveData.billNo,
                orderId: saveData.orderId,
              },
            });
          } catch (err) {
            setLoading(false);
            toast.error(err.message || "Payment processing failed.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.warn("Payment process cancelled.");
          },
        },
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          contact: formData.phone.trim(),
        },
        theme: { color: "#0F8A43" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Could not initiate payment.");
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.pincode.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (paymentMethod === "cod") {
      await processCodOrder();
    } else {
      await initRazorpayPayment();
    }
  };

  return (
    <>
      {(loading || authLoading) && (
        <div className="menvora-preloader-overlay">
          <div className="luxury-center-spinner">
            <div className="luxury-track-ring"></div>
            <div className="luxury-active-glow"></div>
            <FaBolt className="luxury-bolt-core" />
          </div>
        </div>
      )}

      <section className="checkout">
        <div className="container">
          {step === 1 && (
            <div
              className="authContainer"
              style={{
                maxWidth: "450px",
                margin: "40px auto",
                padding: "30px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "10px", color: "#0F8A43" }}>
                Quick Verification
              </h2>
              <p style={{ textAlign: "center", fontSize: "14px", color: "#666", marginBottom: "25px" }}>
                Verify your phone number to proceed to Checkout
              </p>

              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Mobile Number
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      padding: "10px 14px",
                    }}
                  >
                    <FaPhoneAlt style={{ color: "#0F8A43", marginRight: "10px" }} />
                    <input
                      type="tel"
                      maxLength="10"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ border: "none", outline: "none", width: "100%", fontSize: "15px" }}
                    />
                  </div>
                </div>
                <button type="submit" className="placeOrderBtn" style={{ width: "100%" }} disabled={authLoading}>
                  {authLoading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div
              className="authContainer"
              style={{
                maxWidth: "450px",
                margin: "40px auto",
                padding: "30px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "10px", color: "#0F8A43" }}>
                Enter Verification OTP
              </h2>
              <p style={{ textAlign: "center", fontSize: "14px", color: "#666", marginBottom: "25px" }}>
                OTP sent to +91 {phone} (Testing OTP: <strong>1234</strong>)
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Enter OTP
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      padding: "10px 14px",
                    }}
                  >
                    <FaLock style={{ color: "#0F8A43", marginRight: "10px" }} />
                    <input
                      type="text"
                      maxLength="4"
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      style={{ border: "none", outline: "none", width: "100%", fontSize: "15px" }}
                    />
                  </div>
                </div>
                <button type="submit" className="placeOrderBtn" style={{ width: "100%" }} disabled={authLoading}>
                  {authLoading ? "Verifying..." : "Verify & Continue to Checkout"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    marginTop: "15px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    width: "100%",
                  }}
                >
                  Change Mobile Number
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="checkoutGrid">
              <div className="orderSummary">
                <h2>Order Summary</h2>
                <div className="productCard">
                  <img src="/images/product/bottle.png" alt="Menvora Product" />
                  <div>
                    <h3>{packageName}</h3>
                    <p>Premium Ayurvedic Formula</p>
                    <strong>₹{productPrice}</strong>
                  </div>
                </div>

                <div className="quantityBox">
                  <h4>Quantity</h4>
                  <div className="quantityButtons">
                    <button
                      type="button"
                      disabled={isPackageSelected || quantity <= 1}
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    >
                      <FaMinus />
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      disabled={isPackageSelected}
                      onClick={() => setQuantity((prev) => prev + 1)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <div className="priceDetails">
                  <div>
                    <span>Taxable Base Value</span>
                    <strong>₹{basePrice}</strong>
                  </div>
                  <div>
                    <span>GST (5% Included)</span>
                    <strong style={{ color: "#0F8A43" }}>+ ₹{gstAmount}</strong>
                  </div>
                  <div>
                    <span>Subtotal</span>
                    <strong>₹{subtotal}</strong>
                  </div>
                  {isOnlinePayment && (
                    <div>
                      <span>Online Payment Discount (5%)</span>
                      <strong style={{ color: "#0F8A43" }}>₹{discount}</strong>
                    </div>
                  )}
                  <div>
                    <span>Shipping</span>
                    <strong style={{ color: "#0F8A43" }}>FREE</strong>
                  </div>
                  <div className="totalRow">
                    <span>Total (Incl. Taxes)</span>
                    <strong>₹{total}</strong>
                  </div>
                </div>
              </div>

              <div className="checkoutForm">
                <h2>Shipping Details</h2>
                <form onSubmit={handleOrder}>
                  <div className="formGrid">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name *"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    <input
                      type="tel"
                      name="phone"
                      maxLength="10"
                      placeholder="10-Digit Mobile Number *"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address *"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <textarea
                      name="address"
                      placeholder="Flat, House no., Building, Road *"
                      required
                      value={formData.address}
                      onChange={handleChange}
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City *"
                      required
                      value={formData.city}
                      onChange={handleChange}
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State *"
                      required
                      value={formData.state}
                      onChange={handleChange}
                    />
                    <input
                      type="text"
                      name="pincode"
                      maxLength="6"
                      placeholder="6-Digit Pincode *"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                    <input
                      type="text"
                      name="landmark"
                      placeholder="Landmark (Optional)"
                      value={formData.landmark}
                      onChange={handleChange}
                    />
                  </div>

                  <h2 className="paymentTitle">Select Payment Method</h2>
                  <div className="paymentMethods">
                    <label className={paymentMethod === "cod" ? "active" : ""}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <FaMoneyBillWave />
                      <span>Cash On Delivery (COD)</span>
                    </label>

                    <label className={paymentMethod === "upi" ? "active" : ""}>
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === "upi"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <FaUniversity />
                      <span>UPI / GooglePay / PhonePe</span>
                    </label>

                    <label className={paymentMethod === "card" ? "active" : ""}>
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <FaCreditCard />
                      <span>Debit / Credit Card</span>
                    </label>
                  </div>

                  <button type="submit" className="placeOrderBtn" disabled={loading}>
                    {loading
                      ? "Processing..."
                      : paymentMethod === "cod"
                      ? "Place Order (COD)"
                      : `Pay ₹${total} Now`}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </section>
    </>
  );
}