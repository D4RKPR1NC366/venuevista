import React, { useEffect, useState } from "react";
import TopBar from "./TopBar";
import "./review.css";
import Footer from "./Footer";





const Reviews = () => {
  const [userReviews, setUserReviews] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    // Fetch reviews from backend
    import('../services/api').then(({ default: api }) => {
      api.get('/reviews')
        .then(res => setUserReviews(res.data))
        .catch(() => setUserReviews([]));
    });
  }, []);

  const openImageModal = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setSelectedImages([]);
    setCurrentImageIndex(0);
    setShowImageModal(false);
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setSelectedReview(null);
    setShowReviewModal(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === selectedImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedImages.length - 1 : prev - 1
    );
  };

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
            <div 
              className="review-card review-card-modern" 
              key={idx}
              onClick={() => openReviewModal(review)}
              style={{ cursor: 'pointer' }}
            >
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
                <div className="review-images-container" onClick={(e) => e.stopPropagation()}>
                  <div className="review-images-grid">
                    {review.images.slice(0, 3).map((img, imgIdx) => (
                      <div key={imgIdx} className="review-image-wrapper">
                        <img 
                          src={img} 
                          alt={`Review ${idx + 1} - ${imgIdx + 1}`}
                          className="review-image-preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(review.images, imgIdx);
                          }}
                          onError={(e) => {
                            console.error('Failed to load image:', img);
                            e.target.style.display = 'none';
                          }}
                        />
                        {imgIdx === 2 && review.images.length > 3 && (
                          <div className="review-image-overlay" onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(review.images, imgIdx);
                          }}>
                            <span>+{review.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {review.images.length > 3 && (
                    <button 
                      className="view-all-images-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(review.images, 0);
                      }}
                    >
                      View all {review.images.length} photos
                    </button>
                  )}
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
      
      {/* Review Images Modal */}
      {showImageModal && (
        <div className="review-image-modal-overlay" onClick={closeImageModal}>
          <div className="review-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Review Images ({currentImageIndex + 1} of {selectedImages.length})</h3>
              <button className="review-modal-close" onClick={closeImageModal}>
                ×
              </button>
            </div>
            
            <div className="review-modal-content">
              <div className="review-image-display">
                <img 
                  src={selectedImages[currentImageIndex]} 
                  alt={`Review image ${currentImageIndex + 1}`}
                  className="review-modal-image"
                />
                
                {selectedImages.length > 1 && (
                  <>
                    <button className="review-nav-btn review-nav-prev" onClick={prevImage}>
                      ‹
                    </button>
                    <button className="review-nav-btn review-nav-next" onClick={nextImage}>
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {selectedImages.length > 1 && (
                <div className="review-image-thumbnails">
                  {selectedImages.map((img, index) => (
                    <div 
                      key={index}
                      className={`review-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      {showReviewModal && selectedReview && (
        <div className="review-details-modal-overlay" onClick={closeReviewModal}>
          <div className="review-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Review Details</h3>
              <button className="review-modal-close" onClick={closeReviewModal}>
                ×
              </button>
            </div>
            
            <div className="review-details-content">
              <div className="review-details-header">
                <div className="review-details-name">
                  <h4>{getDisplayName(selectedReview)}</h4>
                  <div className="review-details-rating">
                    {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                    <span className="rating-text">({selectedReview.rating}/5)</span>
                  </div>
                </div>
                <div className="review-details-meta">
                  <span className="review-details-date">{selectedReview.date}</span>
                  <span className="review-details-source">Review from {selectedReview.source}</span>
                </div>
              </div>
              
              <div className="review-details-comment">
                <h5>Review:</h5>
                <p>{selectedReview.comment}</p>
              </div>
              
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="review-details-images">
                  <h5>Photos ({selectedReview.images.length}):</h5>
                  <div className="review-details-images-grid">
                    {selectedReview.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="review-details-image-wrapper">
                        <img 
                          src={img} 
                          alt={`Review image ${imgIdx + 1}`}
                          className="review-details-image"
                          onClick={() => {
                            closeReviewModal();
                            openImageModal(selectedReview.images, imgIdx);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Reviews;