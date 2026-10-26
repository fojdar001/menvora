import "./Stats.css";
import {
  FaUsers,
  FaStar,
  FaTruck,
  FaShieldAlt,
} from "react-icons/fa";

export default function Stats() {
  return (
    <section className="stats">

      <div className="container">

        <div className="statsHeading">

          <span>OUR ACHIEVEMENTS</span>

          <h2>Trusted By Thousands Across India</h2>

          <p>
            Premium quality, fast delivery and secure shopping
            experience trusted by thousands of happy customers.
          </p>

        </div>

        <div className="statsGrid">

          <div className="statCard">
            <div className="iconBox">
              <FaUsers className="statIcon" />
            </div>

            <h2>10K+</h2>

            <p>Happy Customers</p>
          </div>

          <div className="statCard">
            <div className="iconBox">
              <FaStar className="statIcon" />
            </div>

            <h2>4.8★</h2>

            <p>Average Rating</p>
          </div>

          <div className="statCard">
            <div className="iconBox">
              <FaTruck className="statIcon" />
            </div>

            <h2>Free</h2>

            <p>Shipping Pan India</p>
          </div>

          <div className="statCard">
            <div className="iconBox">
              <FaShieldAlt className="statIcon" />
            </div>

            <h2>100%</h2>

            <p>Secure Payments</p>
          </div>

        </div>

      </div>

    </section>
  );
}