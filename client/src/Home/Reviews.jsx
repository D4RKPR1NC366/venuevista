import React from "react";
import TopBar from "./TopBar";
import "./review.css";


export const reviews = [
  {
    name: "graham User",
    rating: 5,
    comment: "These are fantastic shoes. They are extremely well made from the leather used down to the sole. Very solid, well constructed, and comfortable. The stitching is flawless. If you look on the People Shoes website they make certain recommendations regarding how their shoes will fit. Before you select your size, I would check out what they suggest for the particular model. If they recommend going a half size to a full size smaller (button line), they know what a much useful shoe look no more!",
    date: "2019-03-03",
    source: "Customer",
  
  },
  {
    name: "Jane Doe",
    rating: 5,
    comment: "Amazing service! Highly recommend.",
    date: "2025-10-12",
    source: "Customer",
    logo: null
  },
  {
    name: "John Smith",
    rating: 4,
    comment: "Very professional and friendly staff.",
    date: "2025-09-28",
    source: "Customer",
    logo: null
  },
  {
    name: "Emily Lee",
    rating: 5,
    comment: "My event was perfect thanks to Goldust Creation!",
    date: "2025-08-15",
    source: "Customer",
    logo: null
  },
  {
    name: "Michael Brown",
    rating: 5,
    comment: "The best event planning team in town!",
    date: "2025-07-22",
    source: "Customer",
    logo: null
  },
  {
    name: "Sarah Wilson",
    rating: 4,
    comment: "Great experience overall, will book again.",
    date: "2025-06-30",
    source: "Customer",
    logo: null
  }
];

const Reviews = () => {
  return (
    <>
      <TopBar />
      <div className="reviews-container">
        <h2>Customer Reviews</h2>
        <div className="reviews-list reviews-grid">
          {reviews.map((review, idx) => (
            <div className="review-card review-card-modern" key={idx}>
              <div className="review-header">
                <span className="review-name">{review.name}</span>
                <span className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div className="review-date-source">
                <span className="review-date">{review.date}</span>
                <span className="review-source">Review from {review.source}</span>
              </div>
              <div className="review-comment">{review.comment}</div>
              {review.logo && (
                <div className="review-logo-row">
                  <img src={review.logo} alt={review.source + ' logo'} className="review-logo" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Reviews;