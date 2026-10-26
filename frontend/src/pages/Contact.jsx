import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaBolt } from "react-icons/fa"; // Spinner Icon
import "../components/Contact/Contact.css"; 

export default function Contact() {
  // 💡 FIX: Fallback URL ko rigid 'localhost' kiya taaki CORS error "Failed to connect" na aaye
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://menvora-backend.vercel.app";

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true); // Premium Transition Spinner
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error("Please fill in all the required fields!", { theme: "dark" });
      return;
    }

    if (formData.phone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number!", { theme: "dark" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Thank you! Your message has been sent successfully.", { theme: "dark" });
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        toast.error(data.message || "Something went wrong. Please try again.", { theme: "dark" });
      }
    } catch (error) {
      console.error("CORS/Connection Error:", error);
      toast.error("Failed to connect to the server. Please check your connection.", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* MAIN CONTACT CONTAINER (Matches Your Custom CSS) */}
      <section className="contact-section">
        <div className="contact-header">
          <h2>Contact Us</h2>
          <p>Have questions about Menvora? We are here to help. Drop us a message below.</p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form-container">
          <input 
            type="text" 
            name="name" 
            placeholder="Your Full Name *" 
            required 
            value={formData.name} 
            onChange={handleChange} 
            className="contact-input"
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Your Email Address *" 
            required 
            value={formData.email} 
            onChange={handleChange} 
            className="contact-input"
          />
          <input 
            type="tel" 
            name="phone" 
            placeholder="Your 10-Digit Mobile Number *" 
            required 
            value={formData.phone} 
            onChange={handleChange} 
            className="contact-input"
          />
          <textarea 
            name="message" 
            placeholder="Type your message here... *" 
            rows="5" 
            required 
            value={formData.message} 
            onChange={handleChange} 
            className="contact-textarea"
          />

          <button type="submit" disabled={submitting} className="contact-submit-btn">
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>

        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </section>
    </>
  );
}