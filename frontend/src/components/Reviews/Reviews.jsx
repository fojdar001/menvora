import "./Reviews.css";

import {
  FaStar,
  FaCheckCircle,
  FaPlayCircle
} from "react-icons/fa";

export default function Reviews() {

  const reviews = [
    {
      name: "Rahul Sharma",
      city: "Delhi",
      image: "/images/product/man1.png",
      review:
        "Excellent product! Packaging was premium and I am very satisfied with the overall quality.",
    },
    {
      name: "Aman Verma",
      city: "Mumbai",
      image: "/images/product/man2.png",
      review:
        "Delivery was fast and the product quality exceeded my expectations. Highly recommended.",
    },
    {
      name: "Rohit Singh",
      city: "Jaipur",
      image: "/images/product/man3.png",
      review:
        "Very premium experience from ordering to delivery. Will definitely order again.",
    },
  ];

  return (

    <section className="reviews" id="reviews">

      {/* Glow */}

      <div className="reviewGlow glow1"></div>
      <div className="reviewGlow glow2"></div>

      <div className="container">

        {/* Heading */}

        <div className="reviewHeading">

          <span>

            ⭐ CUSTOMER REVIEWS

          </span>

          <h2>

            Loved By

            <span> Thousands</span>

          </h2>

          <p>

            Real customer experiences from across India.

          </p>

        </div>

        {/* Rating */}

        <div className="overallRating">

          <h1>4.9</h1>

          <div>

            <div className="stars">

              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />

            </div>

            <p>

              Based on 10,000+ Happy Customers

            </p>

          </div>

        </div>

        {/* Cards */}

        <div className="reviewGrid">

          {reviews.map((item, index) => (

            <div className="reviewCard" key={index}>

              <div className="reviewTop">

                <img
                  src={item.image}
                  alt={item.name}
                />

                <div>

                  <h3>

                    {item.name}

                  </h3>

                  <small>

                    {item.city}

                  </small>

                </div>

              </div>

              <div className="stars smallStars">

                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />

              </div>

              <p className="reviewText">

                "{item.review}"

              </p>

              <div className="verified">

                <FaCheckCircle />

                Verified Purchase

              </div>

            </div>

          ))}

        </div>

        {/* Video Review */}

        <div className="videoReviewCard">

          <div className="videoLeft">

            <h3>

              Watch Customer Review

            </h3>

            <p>

              Hear directly from our satisfied customers.

            </p>

          </div>

          <div className="videoRight">

            <button>

              <FaPlayCircle />

            </button>

          </div>

        </div>

      </div>

    </section>

  );

}