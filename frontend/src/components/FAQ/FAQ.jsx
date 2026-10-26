import "./FAQ.css";
import { useState } from "react";
import {
  FaPlus,
  FaMinus,
  FaQuestionCircle
} from "react-icons/fa";

export default function FAQ() {

  const faqs = [
    {
      question: "Is Menvora 100% Ayurvedic?",
      answer:
        "Yes. Menvora is made with carefully selected Ayurvedic herbal ingredients."
    },
    {
      question: "Are there any side effects?",
      answer:
        "Menvora is formulated using herbal ingredients. If you have any medical condition or take medications, consult a healthcare professional before use."
    },
    {
      question: "How should I use Menvora?",
      answer:
        "Follow the usage instructions printed on the product packaging or as advised by your healthcare professional."
    },
    {
      question: "How long does delivery take?",
      answer:
        "Orders are usually delivered within 3–7 business days depending on your location."
    },
    {
      question: "Is Cash on Delivery available?",
      answer:
        "Yes, Cash on Delivery is available in most serviceable locations across India."
    },
    {
      question: "Is online payment secure?",
      answer:
        "Absolutely. All online payments are processed through secure payment gateways."
    },
    {
      question: "Can I order multiple bottles?",
      answer:
        "Yes. You can order multiple packs and take advantage of combo offers available on our website."
    },
    {
      question: "How can I contact support?",
      answer:
        "You can contact us via WhatsApp, email, or our customer support number."
    }
  ];

  const [active, setActive] = useState(null);

  const toggleFAQ = (index) => {
    setActive(active === index ? null : index);
  };

  return (

    <section className="faq" id="faq">

      <div className="faqGlow glowLeft"></div>
      <div className="faqGlow glowRight"></div>

      <div className="container">

        <div className="faqHeading">

          <span>

            <FaQuestionCircle />

            FREQUENTLY ASKED QUESTIONS

          </span>

          <h2>

            Got Questions?

            <span> We Have Answers</span>

          </h2>

          <p>

            Everything you need to know before placing your order.

          </p>

        </div>

        <div className="faqContainer">

          {faqs.map((item, index) => (

            <div
              key={index}
              className={`faqItem ${
                active === index ? "active" : ""
              }`}
            >

              <button
                className="faqQuestion"
                onClick={() => toggleFAQ(index)}
              >

                <span>

                  {item.question}

                </span>

                {active === index ? (

                  <FaMinus />

                ) : (

                  <FaPlus />

                )}

              </button>

              <div
                className={`faqAnswer ${
                  active === index ? "show" : ""
                }`}
              >

                <p>

                  {item.answer}

                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>

  );

}