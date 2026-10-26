import "./BeforeAfter.css";

import {
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaLeaf,
  FaShieldAlt,
  FaStar
} from "react-icons/fa";

export default function BeforeAfter() {

  return (

    <section className="beforeAfter" id="results">

      {/* Background Glow */}

      <div className="baGlow baGlow1"></div>
      <div className="baGlow baGlow2"></div>

      <div className="container">

        {/* Heading */}

        <div className="baHeading">

          <span>

            <FaStar />

            BEFORE & AFTER

          </span>

          <h2>

            Feel The Difference

            <span> Naturally</span>

          </h2>

          <p>

            Compare the transformation with Menvora's premium Ayurvedic
            wellness formula trusted by thousands of happy customers.

          </p>

        </div>

        {/* Cards */}

        <div className="baGrid">

          {/* BEFORE */}

          <div className="baCard beforeCard">

            <div className="baImage">

              <img
                src="/images/product/before.png"
                alt="Before"
              />

            </div>

            <h3>

              BEFORE

            </h3>

            <ul>

              <li>

                <FaTimesCircle />

                Low Energy

              </li>

              <li>

                <FaTimesCircle />

                Poor Confidence

              </li>

              <li>

                <FaTimesCircle />

                Daily Weakness

              </li>

              <li>

                <FaTimesCircle />

                Low Stamina

              </li>

            </ul>

          </div>

          {/* VS */}

          <div className="vsCircle">

            <FaArrowRight />

          </div>

          {/* AFTER */}

          <div className="baCard afterCard">

            <div className="baImage">

              <img
                src="/images/product/after.png"
                alt="After"
              />

            </div>

            <h3>

              AFTER

            </h3>

            <ul>

              <li>

                <FaCheckCircle />

                Better Energy

              </li>

              <li>

                <FaCheckCircle />

                More Confidence

              </li>

              <li>

                <FaCheckCircle />

                Daily Vitality

              </li>

              <li>

                <FaCheckCircle />

                Active Lifestyle

              </li>

            </ul>

          </div>

        </div>

        {/* Bottom Trust */}

        <div className="baTrust">

          <div>

            <FaLeaf />

            <span>

              100% Ayurvedic

            </span>

          </div>

          <div>

            <FaShieldAlt />

            <span>

              Premium Quality

            </span>

          </div>

          <div>

            ⭐

            <span>

              10,000+ Happy Customers

            </span>

          </div>

        </div>

      </div>

    </section>

  );

}