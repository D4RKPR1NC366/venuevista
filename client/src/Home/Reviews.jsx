import React, { useEffect, useState } from "react";
import TopBar from "./TopBar";
import "./review.css";





const Reviews = () => {
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    // Fetch reviews from backend
    import('../services/api').then(({ default: api }) => {
      api.get('/reviews')
        .then(res => setUserReviews(res.data))
        .catch(() => setUserReviews([]));
    });
  }, []);

  // Show only first name if available, otherwise 'Anonymous'
  const getDisplayName = (review) => {
    if (review.name && review.name !== 'Anonymous') {
      const parts = review.name.trim().split(' ');
      return parts[0];
    }
    // Try to get from localStorage user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name && typeof user.name === 'string') {
      const parts = user.name.trim().split(' ');
      return parts[0];
    }
    return 'Anonymous';
  };
  const allReviews = userReviews;

  return (
    <>
      <TopBar />
      <div className="reviews-container">
        <h2 className="review-title-script">Customer Reviews</h2>
        <div className="reviews-list reviews-grid">
          {allReviews.map((review, idx) => (
            <div className="review-card review-card-modern" key={idx}>
              <div className="review-header">
                <span className="review-name">{getDisplayName(review)}</span>
                <span className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div className="review-date-source">
                <span className="review-date">{review.date}</span>
                <span className="review-source">Review from {review.source}</span>
              </div>
              <div className="review-comment">{review.comment}</div>
              {review.images && review.images.length > 0 && (
                <div style={{display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
                  {review.images.map((img, imgIdx) => (
                    <img 
                      key={imgIdx} 
                      src={img} 
                      alt={`Review ${idx + 1} - ${imgIdx + 1}`}
                      style={{
                        width: 80, 
                        height: 80, 
                        objectFit: 'cover', 
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid #e0e0e0'
                      }}
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
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