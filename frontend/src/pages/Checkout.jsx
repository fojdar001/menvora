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
} from "react-icons/fa";

import "../components/Checkout/Checkout.css";

const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || "https://menvora-backend.onrender.com"
).replace(/\/$/, "");
const RAZORPAY_KEY =
  process.env.REACT_APP_RAZORPAY_KEY || "rzp_live_TsUqPWXB1ZVKKJ";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Checkout State (Direct Order Flow - No OTP)
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

  // Pre-fill saved phone if available
  useEffect(() => {
    const savedPhone =
      localStorage.getItem("menvora_phone") ||
      localStorage.getItem("menvora_user_phone");

    if (savedPhone) {
      setFormData((prev) => ({ ...prev, phone: savedPhone }));
    }
  }, []);

  // Update package details from router location state
  useEffect(() => {
    const state = location.state || {};
    const pkg = state.packageData || state;

    const amount = pkg?.amount ?? pkg?.totalAmount ?? pkg?.price;
    if (amount) {
      setProductPrice(Number(amount));
      const title = pkg.title || pkg.packageName;
      setPackageName(
        title ? `Menvora Combo (${title})` : "Menvora Ayurvedic Package"
      );
      if (pkg.quantity && Number(pkg.quantity) > 0) {
        setQuantity(Number(pkg.quantity));
      }
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
      const cleanPhone = formData.phone.trim().replace(/\D/g, "");
      const token = localStorage.getItem("menvora_token");

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const orderData = {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
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
        headers,
        body: JSON.stringify(orderData),
      });

      const savedResData = await res.json();

      if (!res.ok || !savedResData.success) {
        throw new Error(
          savedResData.error || savedResData.message || "Failed to save order."
        );
      }

      localStorage.setItem("menvora_phone", cleanPhone);

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

  // Process Online Payment (Razorpay)
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

      const cleanPhone = formData.phone.trim().replace(/\D/g, "");

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
            const headers = {
              "Content-Type": "application/json",
            };
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }

            const payload = {
              fullName: formData.fullName.trim(),
              phone: cleanPhone,
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
              headers,
              body: JSON.stringify(payload),
            });

            const saveData = await saveRes.json();

            if (!saveRes.ok || !saveData.success) {
              throw new Error(saveData.error || "Payment verification failed.");
            }

            localStorage.setItem("menvora_phone", cleanPhone);

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
          contact: cleanPhone,
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
    if (loading) return;

    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    const cleanPincode = formData.pincode.trim().replace(/\D/g, "");

    if (
      !formData.fullName.trim() ||
      !cleanPhone ||
      !formData.email.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !cleanPincode
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (cleanPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode.");
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
      {loading && (
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
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </section>
    </>
  );
}