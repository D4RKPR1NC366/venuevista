

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ClientSidebar from './ClientSidebar';
import './BookingInformation.css';




const BookingInformation = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user info (match Login.jsx logic)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;

  const fetchBookings = async () => {
    try {
      // Fetch all bookings and filter by user email
      const [pendingRes, approvedRes, finishedRes] = await Promise.all([
        api.get('/bookings/pending'),
        api.get('/bookings/approved'),
        api.get('/bookings/finished'),
      ]);
      const pending = pendingRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Pending' }));
      const approved = approvedRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Approved' }));
      const finished = finishedRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Finished' }));
      setBookings([...pending, ...approved, ...finished]);
    } catch (err) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) fetchBookings();
  }, [userEmail]);


  const handleCardClick = (booking) => {
    // Only open booking details if not currently opening review modal
    if (!showReviewModal) {
      // Refetch bookings to get fresh data
      fetchBookings().then(() => {
        // Find the updated booking
        const updatedBooking = bookings.find(b => b._id === booking._id) || booking;
        setSelectedBooking(updatedBooking);
        setShowModal(true);
      });
    }
  };

  const handleReviewClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setReviewRating(0);
    setReviewText('');
    setIsAnonymous(false);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewText('');
    setIsAnonymous(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get user's full name from different possible fields
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.name || user.firstName || user.lastName || 'User';
    
    const newReview = {
      name: isAnonymous ? 'Anonymous' : userName,
      rating: reviewRating,
      comment: reviewText,
      date: new Date().toISOString().slice(0, 10),
      source: 'Customer',
      logo: null,
      bookingId: selectedBooking?._id || null,
      userId: user._id || null
    };
    
    try {
      await api.post('/reviews', newReview);
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewText('');
      setIsAnonymous(false);
      alert('Thank you for your review!');
    } catch (err) {
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className="booking-page">
  <ClientSidebar userType={JSON.parse(localStorage.getItem('user') || '{}').role === 'supplier' ? 'supplier' : 'client'} />
      <div className="booking-content">
        <h2 style={{fontSize: '1.7rem', fontWeight: 800, marginBottom: 18, color: '#333'}}>Your Bookings</h2>
        {loading ? (
          <div>Loading bookings...</div>
        ) : (
          <div className="booking-list">
            {bookings.length === 0 ? (
              <div>No bookings found.</div>
            ) : (
              bookings.map((booking, idx) => (
                <div
                  key={booking._id || idx}
                  className="booking-card"
                  onClick={() => handleCardClick(booking)}
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    position: 'relative'
                  }}
                >
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h4>{booking.eventType || booking.title}</h4>
                    <div style={{fontSize: '1.05rem', color: '#666'}}>{booking.date ? new Date(booking.date).toLocaleDateString() : ''}</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8}}>
                    <span className="status">
                      Status: {booking.status}
                    </span>
                    {booking.status === 'Finished' && (
                      <button
                        style={{
                          background: '#ffe066',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 16px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}
                        onClick={e => handleReviewClick(booking, e)}
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Modal */}
        {showModal && selectedBooking && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <div className="booking-modal-content" style={{
              background: '#fff', 
              borderRadius: 8, 
              padding: 32, 
              maxWidth: 1000, 
              width: '95%', 
              maxHeight: '90vh',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)', 
              position: 'relative',
              overflow: 'auto'
            }}>
              <button onClick={handleCloseModal} style={{position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer'}}>&times;</button>
              <h2 style={{fontWeight: 800, fontSize: '1.8rem', marginBottom: 24}}>Booking Details</h2>
              <div style={{background: '#ffe066', borderRadius: 12, padding: 20, marginBottom: 24}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  <div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Contact Number:</strong> {selectedBooking.contact}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Email Address:</strong> {selectedBooking.email}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Total Price:</strong> PHP {selectedBooking.totalPrice}</div>
                  </div>
                  <div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Event Date:</strong> {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : ''}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Event Venue:</strong> {selectedBooking.eventVenue}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Guest Count:</strong> {selectedBooking.guestCount}</div>
                  </div>
                </div>
                <div style={{marginTop: 10, fontSize: '0.95rem'}}>
                  <strong>Appointment Method:</strong> {selectedBooking.outsidePH === 'yes' ? 'Face to Face' : selectedBooking.outsidePH === 'no' ? 'Virtual/Online' : 'Not specified'}
                </div>
              </div>
              <h3 style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 16}}>Services and Products Availed</h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24}}>
                {selectedBooking.products && selectedBooking.products.length > 0 ? (
                  selectedBooking.products.map((prod, i) => (
                    <div key={i} style={{
                      background: '#ffe066', 
                      borderRadius: 12, 
                      padding: '12px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      height: '60px'
                    }}>
                      {prod.image && <img src={prod.image} alt={prod.title} style={{width: 40, height: 40, borderRadius: 6, objectFit: 'cover'}} />}
                      <div>
                        <div style={{fontWeight: 700, fontSize: '0.95rem'}}>{prod.title}</div>
                        <div style={{fontSize: '0.95rem'}}>PHP {prod.price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>No products/services listed.</div>
                )}
              </div>
              <h3 style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 16}}>Selected Additionals</h3>
              <div style={{background: '#fff', borderRadius: 12, marginBottom: 24}}>
                {selectedBooking.products && selectedBooking.products.some(p => p.additionals?.length > 0) ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    padding: '8px',
                  }}>
                    {selectedBooking.products.map(prod => 
                      prod.additionals?.map((additional, idx) => (
                        <div key={`${prod.title}-${idx}`} 
                             style={{
                               display: 'flex', 
                               justifyContent: 'space-between',
                               padding: '12px 24px',
                               border: '1px solid #ddd',
                               borderRadius: '8px',
                               fontSize: '0.95rem'
                             }}>
                          <span>{additional.title}</span>
                          <span style={{color: '#666'}}>PHP {additional.price}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={{fontSize: '0.95rem', padding: '16px 24px'}}>No additionals selected</div>
                )}
              </div>
              <h3 style={{fontWeight: 700, fontSize: '1.1rem', marginBottom: 10}}>Special Request</h3>
              <div style={{background: '#fffbe6', borderRadius: 12, padding: 16, border: '1px solid #ffe066', minHeight: 60, marginBottom: 24}}>
                {selectedBooking.specialRequest || 'None'}
              </div>

              {/* Payment Details Display */}
              {selectedBooking.paymentDetails && (
                <>
                  <h3 style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 16}}>Payment Details</h3>
                  <div style={{ 
                    background: '#e8f5e9', 
                    borderRadius: 12, 
                    padding: 24,
                    border: '2px solid #4CAF50',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Payment Status</div>
                        <div style={{ 
                          fontWeight: 800, 
                          fontSize: '1.1rem', 
                          color: selectedBooking.paymentDetails.paymentStatus === 'Fully Paid' ? '#4CAF50' : 
                                 selectedBooking.paymentDetails.paymentStatus === 'Partially Paid' ? '#FF9800' : 
                                 selectedBooking.paymentDetails.paymentStatus === 'Refunded' ? '#e53935' : '#666'
                        }}>
                          {selectedBooking.paymentDetails.paymentStatus}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Amount Paid</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#222' }}>PHP {selectedBooking.paymentDetails.amountPaid}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Payment Date</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>{selectedBooking.paymentDetails.paymentDate}</div>
                      </div>
                      {selectedBooking.paymentDetails.transactionReference && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Transaction Reference</div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#222', wordBreak: 'break-all' }}>{selectedBooking.paymentDetails.transactionReference}</div>
                        </div>
                      )}
                    </div>
                    {selectedBooking.paymentDetails.paymentProof && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 10 }}>Payment Proof</div>
                        <img 
                          src={selectedBooking.paymentDetails.paymentProof} 
                          alt="Payment Proof" 
                          style={{ 
                            maxWidth: '300px', 
                            maxHeight: '200px', 
                            borderRadius: 8, 
                            border: '2px solid #ddd',
                            objectFit: 'contain'
                          }} 
                        />
                      </div>
                    )}
                    {selectedBooking.paymentDetails.paymentNotes && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Additional Notes</div>
                        <div style={{ fontSize: '0.95rem', color: '#222', fontStyle: 'italic' }}>{selectedBooking.paymentDetails.paymentNotes}</div>
                      </div>
                    )}
                    {selectedBooking.totalPrice && selectedBooking.paymentDetails.amountPaid && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #c8e6c9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555' }}>Total Booking Amount:</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#222' }}>PHP {selectedBooking.totalPrice}</div>
                        </div>
                        {selectedBooking.paymentDetails.amountPaid < selectedBooking.totalPrice && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e53935' }}>Remaining Balance:</div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e53935' }}>PHP {selectedBooking.totalPrice - selectedBooking.paymentDetails.amountPaid}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={handleCloseReviewModal} 
                style={{
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 28, 
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                &times;
              </button>
              
              <h2 style={{fontWeight: 800, fontSize: '1.5rem', marginBottom: 20, color: '#333'}}>Write a Review</h2>
              
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>Rating</label>
                <div style={{display: 'flex', gap: 8}}>
                  {[1,2,3,4,5].map(star => (
                    <span
                      key={star}
                      style={{
                        fontSize: 36,
                        color: star <= reviewRating ? '#ffc107' : '#e4e5e9',
                        cursor: 'pointer',
                        transition: 'color 0.2s, transform 0.2s'
                      }}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  rows={5}
                  style={{
                    width: '100%', 
                    borderRadius: 8, 
                    border: '2px solid #e0e0e0', 
                    padding: 12, 
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ffe066'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{marginBottom: 24}}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{
                      marginRight: 8,
                      width: 18,
                      height: 18,
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{fontSize: '14px', color: '#666'}}>Post as Anonymous</span>
                </label>
              </div>

              <button
                style={{
                  background: reviewRating && reviewText.trim() ? '#ffe066' : '#e0e0e0',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: reviewRating && reviewText.trim() ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.2s',
                  color: '#333'
                }}
                disabled={!reviewRating || !reviewText.trim()}
                onClick={handleSubmitReview}
                onMouseEnter={(e) => {
                  if (reviewRating && reviewText.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255,224,102,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingInformation;
