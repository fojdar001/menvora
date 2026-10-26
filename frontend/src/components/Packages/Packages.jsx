import "./Packages.css";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaShippingFast,
  FaShieldAlt,
  FaFire,
  FaBolt,
} from "react-icons/fa";

const packages = [
  {
    id: "pkg-1",
    title: "1 Bottle",
    price: "₹999",
    numericAmount: 999,
    oldPrice: "₹1599",
    save: "Save ₹600",
    image: "/images/product/bottle1.png",
    popular: false,
  },
  {
    id: "pkg-2",
    title: "2 Bottles",
    price: "₹1799",
    numericAmount: 1799,
    oldPrice: "₹2999",
    save: "Save ₹1200",
    image: "/images/product/bottle2.png",
    popular: true,
  },
  {
    id: "pkg-3",
    title: "3 Bottles",
    price: "₹2499",
    numericAmount: 2499,
    oldPrice: "₹3999",
    save: "Save ₹1500",
    image: "/images/product/bottle3.png",
    popular: false,
  },
];

export default function Packages() {
  const navigate = useNavigate();

  const handlePackageBuy = (item) => {
    const selectedPackage = {
      id: item.id,
      packageName: `Menvora Ayurveda - ${item.title}`,
      price: item.price,
      totalAmount: item.numericAmount,
      image: item.image,
    };

    const token = localStorage.getItem("menvora_token");

    if (!token) {
      // TOKEN NAHI HAI -> SEEDHA LOGIN PAGE PAR BEJO
      navigate("/login", { state: { redirectTo: "/checkout", packageData: selectedPackage } });
    } else {
      // LOGGED IN HAI -> CHECKOUT PAR BEJO
      navigate("/checkout", { state: selectedPackage });
    }
  };

  return (
    <section className="packages" id="packages">
      <div className="container">
        <div className="packageHeading">
          <span>🔥 BEST SELLING COMBOS</span>
          <h2>Choose Your Perfect Package</h2>
          <p>Save more with combo offers and enjoy free shipping across India.</p>
        </div>

        <div className="packageGrid">
          {packages.map((item, index) => (
            <div key={index} className={`packageCard ${item.popular ? "popularCard" : ""}`}>
              {item.popular && (
                <div className="popularTag">
                  <FaFire /> Most Popular
                </div>
              )}

              <img src={item.image} alt={item.title} className="packageImage" />

              <h3>{item.title}</h3>

              <div className="priceArea">
                <span className="oldPrice">{item.oldPrice}</span>
                <h2>{item.price}</h2>
                <small>{item.save}</small>
              </div>

              <div className="packageFeatures">
                <div><FaCheckCircle /> Ayurvedic Formula</div>
                <div><FaShippingFast /> Free Shipping</div>
                <div><FaShieldAlt /> Secure Payment</div>
              </div>

              <div className="packageButtons">
                <button className="greenBtn" onClick={() => handlePackageBuy(item)}>
                  <FaBolt /> BUY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}