import "./Benefits.css";
import {
  FaLeaf,
  FaBolt,
  FaShieldAlt,
  FaHeartbeat,
  FaAward,
  FaTruck,
} from "react-icons/fa";

export default function Benefits() {

  const benefits = [
    {
      icon: <FaLeaf />,
      title: "100% Herbal Formula",
      text: "Made with premium natural ingredients."
    },
    {
      icon: <FaBolt />,
      title: "Daily Energy",
      text: "Supports active lifestyle."
    },
    {
      icon: <FaHeartbeat />,
      title: "Premium Wellness",
      text: "Designed for everyday vitality."
    },
    {
      icon: <FaShieldAlt />,
      title: "Quality Tested",
      text: "Manufactured under strict standards."
    },
    {
      icon: <FaAward />,
      title: "Trusted Brand",
      text: "Thousands of happy customers."
    },
    {
      icon: <FaTruck />,
      title: "Fast Delivery",
      text: "Free Shipping Across India."
    }
  ];

  return (
    <section className="benefits">

      <div className="container">

        <div className="benefitsGrid">

          {/* LEFT */}

          <div className="benefitsImage">

            <div className="imageCircle"></div>

            <img
              src="/images/product/menvora2.png"
              alt="Menvora"
            />

          </div>

          {/* RIGHT */}

          <div className="benefitsContent">

            <span className="sectionTag">
              WHY CHOOSE US
            </span>

            <h2>
              Premium Herbal Wellness
              For Modern Lifestyle
            </h2>

            <p>
              Carefully crafted herbal wellness formula
              made with premium ingredients to support
              confidence, vitality and healthy lifestyle.
            </p>

            <div className="benefitsCards">

              {benefits.map((item,index)=>(

                <div className="benefitCard" key={index}>

                  <div className="benefitIcon">

                    {item.icon}

                  </div>

                  <div>

                    <h4>{item.title}</h4>

                    <p>{item.text}</p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}