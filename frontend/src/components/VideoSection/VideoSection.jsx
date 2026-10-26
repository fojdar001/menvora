import "./VideoSection.css";

import {
  FaLeaf,
  FaTruck,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";

export default function VideoSection() {
  return (
    <section className="videoSection" id="videos">

      {/* Background Glow */}

      <div className="videoGlow videoGlow1"></div>
      <div className="videoGlow videoGlow2"></div>

      <div className="container videoGrid">

        {/* LEFT */}

        <div className="videoContent">

          <span className="videoBadge">

            <FaStar />

            WATCH MENVORA IN ACTION

          </span>

          <h2>

            See Why Thousands

            <span> Trust Menvora</span>

          </h2>

          <p>

            Discover the power of premium Ayurvedic wellness.
            Watch our product in action and see why thousands
            of happy customers choose Menvora every day.

          </p>

          <div className="videoFeatures">

            <div>

              <FaLeaf />

              <span>100% Ayurvedic Formula</span>

            </div>

            <div>

              <FaTruck />

              <span>Free Shipping Across India</span>

            </div>

            <div>

              <FaShieldAlt />

              <span>Safe & Secure Payment</span>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="videoCard">

          <div className="phoneFrame">

            <video
              className="productVideo"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/images/video-thumbnail.jpg"
            >

              <source
                src="/videos/menvora.mp4"
                type="video/mp4"
              />

              Your browser does not support video.

            </video>

          </div>

          <div className="videoInfo">

            <h3>Product Demo</h3>

            <p>

              Watch how Menvora works and why thousands trust it every day.

            </p>

          </div>

        </div>

      </div>

      {/* Bottom Cards */}

      <div className="container">

        <div className="videoStats">

          <div>

            ⭐⭐⭐⭐⭐

            <span>4.8 Rating</span>

          </div>

          <div>

            🌿

            <span>100% Herbal</span>

          </div>

          <div>

            🚚

            <span>Fast Delivery</span>

          </div>

          <div>

            💚

            <span>10,000+ Customers</span>

          </div>

        </div>

      </div>

    </section>
  );
}