

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
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
  const [reviewImages, setReviewImages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState([]);
  
  // Cancellation modal states
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationForm, setCancellationForm] = useState({
    reason: '',
    description: ''
  });

  // Reschedule modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    reason: '',
    proposedDate: '',
    description: ''
  });
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMode: '',
    paymentStatus: '',
    amountPaid: '',
    paymentDate: '',
    transactionReference: '',
    paymentProof: '',
    paymentNotes: ''
  });
  const [paymentProofPreview, setPaymentProofPreview] = useState('');

  // Get user info (match Login.jsx logic)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;

  // Cancellation reasons
  const cancellationReasons = [
    'Change of Plans',
    'Financial Constraints',
    'Found Alternative Service',
    'Event Postponed',
    'Event Cancelled',
    'Personal Emergency',
    'Dissatisfied with Service',
    'Other'
  ];

  // Reschedule reasons
  const rescheduleReasons = [
    'Venue Conflict',
    'Weather Concerns',
    'Guest Availability',
    'Supplier Availability',
    'Personal Reasons',
    'Budget Adjustments',
    'Better Date Available',
    'Other'
  ];

  const fetchBookings = async () => {
    try {
      // Fetch all bookings including cancelled and filter by user email
      const [pendingRes, approvedRes, finishedRes, cancelledRes, reviewsRes] = await Promise.all([
        api.get('/bookings/pending'),
        api.get('/bookings/approved'),
        api.get('/bookings/finished'),
        api.get('/bookings/cancelled'),
        api.get(`/reviews?email=${encodeURIComponent(userEmail)}`)
      ]);
      const pending = pendingRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Pending' }));
      const approved = approvedRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Approved' }));
      const finished = finishedRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Finished' }));
      const cancelled = cancelledRes.data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Cancelled' }));
      setUserReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      setBookings([...pending, ...approved, ...finished, ...cancelled]);
    } catch (err) {
      setBookings([]);
      setUserReviews([]);
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
    setReviewImages([]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 5) {
      alert('You can only upload up to 5 images');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Each image must be less than 5MB`);
        return false;
      }
      return true;
    });
    
    setReviewImages(prev => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get user's full name from different possible fields
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.name || user.firstName || user.lastName || 'User';
    
    // Convert images to base64
    const base64Images = [];
    for (const file of reviewImages) {
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64Images.push(base64);
      } catch (error) {
        console.error('Error converting image to base64:', error);
      }
    }
    
    const reviewData = {
      name: isAnonymous ? 'Anonymous' : userName,
      rating: reviewRating,
      comment: reviewText,
      date: dayjs().format('YYYY-MM-DD'),
      source: 'Customer',
      logo: '',
      images: base64Images,
      ...(selectedBooking?._id && { bookingId: selectedBooking._id }),
      ...(user._id && { userId: user._id })
    };
    
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewText('');
      setIsAnonymous(false);
      setReviewImages([]);
      alert('Thank you for your review!');
    } catch (err) {
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  // Payment modal handlers
  const handlePaymentProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        setPaymentProofPreview(base64);
        setPaymentForm(prev => ({ ...prev, paymentProof: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePaymentProof = () => {
    setPaymentProofPreview('');
    setPaymentForm(prev => ({ ...prev, paymentProof: '' }));
  };

  const handleSubmitPayment = async () => {
    if (!paymentForm.paymentMode || !paymentForm.amountPaid || !paymentForm.paymentDate) {
      alert('Please fill in all required fields (Mode of Payment, Amount Paid, Payment Date)');
      return;
    }

    // Auto-calculate payment status before submitting
    const amountPaid = parseFloat(paymentForm.amountPaid) || 0;
    const totalPrice = selectedBooking?.totalPrice || 0;
    let finalStatus = 'Pending';
    
    if (amountPaid === 0) {
      finalStatus = 'Pending';
    } else if (amountPaid >= totalPrice) {
      finalStatus = 'Fully Paid';
    } else if (amountPaid > 0 && amountPaid < totalPrice) {
      finalStatus = 'Partially Paid';
    }

    try {
      const response = await api.put(`/bookings/${selectedBooking._id}`, {
        paymentDetails: {
          ...paymentForm,
          paymentStatus: finalStatus
        }
      });
      
      if (response.status === 200) {
        alert('Payment details saved successfully!');
        setShowPaymentModal(false);
        // Reset form
        setPaymentForm({
          paymentMode: '',
          paymentStatus: '',
          amountPaid: '',
          paymentDate: '',
          transactionReference: '',
          paymentProof: '',
          paymentNotes: ''
        });
        setPaymentProofPreview('');
        // Refresh bookings to get updated data
        await fetchBookings();
        // Update selected booking with the new payment details immediately
        const updatedBookings = await Promise.all([
          api.get('/bookings/pending'),
          api.get('/bookings/approved'),
          api.get('/bookings/finished')
        ]);
        const allBookings = [
          ...updatedBookings[0].data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Pending' })),
          ...updatedBookings[1].data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Approved' })),
          ...updatedBookings[2].data.filter(b => b.email === userEmail).map(b => ({ ...b, status: 'Finished' }))
        ];
        const updatedBooking = allBookings.find(b => b._id === selectedBooking._id);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        }
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      alert('Failed to save payment details. Please try again.');
    }
  };

  const handleRequestCancellation = () => {
    setCancellationForm({ reason: '', description: '' });
    setShowCancellationModal(true);
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationForm.reason || !cancellationForm.description.trim()) {
      alert('Please provide both a reason and description for cancellation.');
      return;
    }

    try {
      const response = await api.post(`/bookings/${selectedBooking._id}/cancel-request`, {
        reason: cancellationForm.reason,
        description: cancellationForm.description,
        userEmail: userEmail
      });

      if (response.status === 200) {
        alert('Cancellation request submitted successfully! Admin will review your request.');
        setShowCancellationModal(false);
        setCancellationForm({ reason: '', description: '' });
        await fetchBookings();
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error submitting cancellation:', err);
      alert('Failed to submit cancellation request. Please try again.');
    }
  };

  const handleRequestReschedule = () => {
    setRescheduleForm({ reason: '', proposedDate: '', description: '' });
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleForm.reason || !rescheduleForm.proposedDate || !rescheduleForm.description.trim()) {
      alert('Please provide a reason, proposed date, and description for rescheduling.');
      return;
    }

    try {
      const response = await api.post(`/bookings/${selectedBooking._id}/reschedule-request`, {
        reason: rescheduleForm.reason,
        proposedDate: rescheduleForm.proposedDate,
        description: rescheduleForm.description,
        userEmail: userEmail
      });

      if (response.status === 200) {
        alert('Reschedule request submitted successfully! Admin will review your request.');
        setShowRescheduleModal(false);
        setRescheduleForm({ reason: '', proposedDate: '', description: '' });
        await fetchBookings();
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error submitting reschedule:', err);
      alert('Failed to submit reschedule request. Please try again.');
    }
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
              bookings.map((booking, idx) => {
                // Check if a review exists for this booking
                const hasReview = userReviews.some(r => r.bookingId === booking._id);
                return (
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
                    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap'}}>
                      <span className="status" style={{
                        background: booking.status === 'Cancelled' ? '#ffebee' : '',
                        color: booking.status === 'Cancelled' ? '#c62828' : '',
                        border: booking.status === 'Cancelled' ? '1px solid #c62828' : ''
                      }}>
                        Status: {booking.status}
                      </span>
                      {booking.cancellationRequest?.status === 'pending' && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#fff3e0',
                          color: '#e65100',
                          border: '1px solid #ff9800',
                          fontWeight: 600
                        }}>
                          Cancellation Pending
                        </span>
                      )}
                      {booking.cancellationRequest?.status === 'rejected' && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#ffebee',
                          color: '#c62828',
                          border: '1px solid #e57373',
                          fontWeight: 600
                        }}>
                          Cancellation Denied
                        </span>
                      )}
                      {booking.status === 'Finished' && (
                        hasReview ? (
                          <span style={{
                            background: '#e0e0e0',
                            borderRadius: 6,
                            padding: '6px 16px',
                            fontWeight: 600,
                            color: '#888',
                            marginLeft: 8
                          }}>
                            Review Submitted
                          </span>
                        ) : (
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
                        )
                      )}
                    </div>
                  </div>
                );
              })
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
              
              {/* Reference Number Banner */}
              {selectedBooking.referenceNumber && (
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  border: '2px solid #60a5fa'
                }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    📋 Booking Reference Number
                  </div>
                  <div style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {selectedBooking.referenceNumber}
                  </div>
                  <div style={{
                    color: '#dbeafe',
                    fontSize: '0.8rem',
                    marginTop: 8,
                    fontStyle: 'italic'
                  }}>
                    Use this reference number for all communications regarding your booking
                  </div>
                </div>
              )}
              
              <div style={{background: '#ffe066', borderRadius: 12, padding: 20, marginBottom: 24}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  <div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Name:</strong> {selectedBooking.name}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Contact Number:</strong> {selectedBooking.contact}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Email Address:</strong> {selectedBooking.email}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Sub Total:</strong> PHP {selectedBooking.subTotal || selectedBooking.totalPrice || 0}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Promo:</strong> {selectedBooking.promoTitle || selectedBooking.promo || ''}</div>
                    {selectedBooking.discount > 0 && (
                      <div style={{marginBottom: 10, fontSize: '0.95rem', color: '#e53935'}}><strong>Discount Amount:</strong> - PHP {selectedBooking.discount}</div>
                    )}
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Total Price:</strong> <span style={{fontWeight: 'bold'}}>PHP {selectedBooking.totalPrice || 0}</span></div>
                  </div>
                  <div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Event Type:</strong> {selectedBooking.eventType}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Event Date:</strong> {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : ''}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Event Venue:</strong> {selectedBooking.eventVenue}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Branch Location:</strong> {selectedBooking.branchLocation || 'Not specified'}</div>
                    {selectedBooking.theme && <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Theme:</strong> {selectedBooking.theme}</div>}
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Guest Count:</strong> {selectedBooking.guestCount}</div>
                    <div style={{marginBottom: 10, fontSize: '0.95rem'}}><strong>Appointment Method:</strong> {selectedBooking.outsidePH === 'yes' ? 'Face to Face' : selectedBooking.outsidePH === 'no' ? 'Virtual/Online' : 'Not specified'}</div>
                  </div>
                </div>
              </div>
              
              {/* Assigned Suppliers Section */}
              {selectedBooking.suppliers && selectedBooking.suppliers.length > 0 && (
                <div style={{marginBottom: 24}}>
                  <h3 style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 16}}>Assigned Suppliers</h3>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12}}>
                    {selectedBooking.suppliers.map((supplier, idx) => (
                      <div key={supplier._id || idx} style={{
                        background: '#fff3cd',
                        borderRadius: 10,
                        padding: 16,
                        border: '2px solid #F3C13A',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#222' }}>
                          {supplier.companyName || 'N/A'}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          📧 {supplier.email || 'N/A'}
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          📞 {supplier.phone || supplier.contact || 'N/A'}
                        </div>
                        {supplier.branchContacts && supplier.branchContacts.length > 0 && (
                          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                            📍 {supplier.branchContacts.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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

              {/* Payment Section */}
              <div style={{marginBottom: 24}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                  <h3 style={{fontWeight: 700, fontSize: '1.2rem', margin: 0}}>Payment</h3>
                  {!selectedBooking.paymentDetails && (selectedBooking.status === 'Approved' || selectedBooking.status === 'approved') && (
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                      }}
                    >
                      💳 Add Payment
                    </button>
                  )}
                </div>
                {selectedBooking.paymentDetails ? (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3 style={{fontWeight: 700, fontSize: '1.2rem', margin: 0}}>Payment Details</h3>
                    <button
                      onClick={() => {
                        // Pre-populate form with existing payment data
                        setPaymentForm({
                          paymentMode: selectedBooking.paymentDetails.paymentMode || '',
                          paymentStatus: selectedBooking.paymentDetails.paymentStatus || '',
                          amountPaid: selectedBooking.paymentDetails.amountPaid || '',
                          paymentDate: selectedBooking.paymentDetails.paymentDate || '',
                          transactionReference: selectedBooking.paymentDetails.transactionReference || '',
                          paymentProof: selectedBooking.paymentDetails.paymentProof || '',
                          paymentNotes: selectedBooking.paymentDetails.paymentNotes || ''
                        });
                        setPaymentProofPreview(selectedBooking.paymentDetails.paymentProof || '');
                        setShowPaymentModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 20px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.3)';
                      }}
                    >
                      ✏️ Edit Payment
                    </button>
                  </div>
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Mode of Payment</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#222' }}>{selectedBooking.paymentDetails.paymentMode || 'Not specified'}</div>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Total Amount</div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#222' }}>PHP {selectedBooking.totalPrice}</div>
                          </div>
                          {Number(selectedBooking.paymentDetails.amountPaid) < Number(selectedBooking.totalPrice) && (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>Remaining Balance</div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e53935' }}>PHP {Number(selectedBooking.totalPrice) - Number(selectedBooking.paymentDetails.amountPaid)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
                ) : (
                  <div style={{ 
                    background: '#f5f5f5', 
                    borderRadius: 12, 
                    padding: 20,
                    border: '2px dashed #ccc',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>💳</div>
                    <div style={{ fontSize: '0.95rem', color: '#666', fontWeight: 600 }}>
                      {selectedBooking.status === 'pending' || selectedBooking.status === 'Pending'
                        ? 'Payment can be added after booking approval' 
                        : 'No payment details submitted yet'}
                    </div>
                  </div>
                )}
              </div>

              {/* Reschedule & Cancellation Section */}
              {selectedBooking && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '2px dashed #ddd' }}>
                  <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: 12, padding: 10, background: '#f5f5f5', borderRadius: 6 }}>
                    Debug Info - Status: {selectedBooking.status}, Cancellation Status: {selectedBooking.cancellationRequest?.status || 'none'}, Reschedule Status: {selectedBooking.rescheduleRequest?.status || 'none'}
                  </div>

                  {/* Reschedule Button */}
                  {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Approved') && 
                   selectedBooking.rescheduleRequest?.status !== 'pending' && 
                   selectedBooking.rescheduleRequest?.status !== 'approved' && (
                    <button
                      onClick={handleRequestReschedule}
                      style={{
                        background: 'linear-gradient(90deg, #2196f3 0%, #1976d2 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 24px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        width: '100%',
                        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                        transition: 'all 0.2s',
                        marginBottom: 12
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
                      }}
                    >
                      📅 Request Booking Reschedule
                    </button>
                  )}

                  {/* Cancellation Button */}
                  {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Approved') && 
                   selectedBooking.cancellationRequest?.status !== 'pending' && 
                   selectedBooking.cancellationRequest?.status !== 'approved' ? (
                  <button
                    onClick={handleRequestCancellation}
                    style={{
                      background: 'linear-gradient(90deg, #e53935 0%, #d32f2f 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      width: '100%',
                      boxShadow: '0 2px 8px rgba(229, 57, 53, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(229, 57, 53, 0.3)';
                    }}
                  >
                    🚫 Request Booking Cancellation
                  </button>
                  ) : (
                    <div style={{ padding: 15, background: '#fff3cd', borderRadius: 8, color: '#856404' }}>
                      <div style={{ marginBottom: 10 }}>
                        Cannot request cancellation: {selectedBooking.cancellationRequest?.status === 'pending' ? 'Request already pending' : 
                          selectedBooking.cancellationRequest?.status === 'approved' ? 'Already approved (but booking still here - data error)' :
                          (selectedBooking.status !== 'Pending' && selectedBooking.status !== 'Approved') ? `Status is ${selectedBooking.status}` : 'Unknown reason'}
                      </div>
                      {selectedBooking.cancellationRequest?.status === 'approved' && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`http://localhost:5000/bookings/${selectedBooking._id}/reset-cancellation`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' }
                              });
                              if (response.ok) {
                                alert('Cancellation data reset! Please refresh the page.');
                                window.location.reload();
                              }
                            } catch (error) {
                              console.error('Error resetting:', error);
                              alert('Error resetting cancellation data');
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600
                          }}
                        >
                          🔧 Fix This Data Error
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show cancellation request details if exists */}
              {selectedBooking?.cancellationRequest?.status === 'pending' && (
                <div style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  background: '#fff3e0', 
                  borderRadius: 12,
                  border: '2px solid #ff9800'
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e65100', marginBottom: 12 }}>
                    ⚠️ Cancellation Request Pending
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Reason:</strong> {selectedBooking.cancellationRequest.reason}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Description:</strong> {selectedBooking.cancellationRequest.description}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginTop: 12 }}>
                    Your cancellation request is being reviewed by the admin.
                  </div>
                </div>
              )}

              {selectedBooking?.cancellationRequest?.status === 'rejected' && (
                <div style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  background: '#ffebee', 
                  borderRadius: 12,
                  border: '2px solid #c62828'
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#c62828', marginBottom: 12 }}>
                    ❌ Cancellation Request Denied
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Your Reason:</strong> {selectedBooking.cancellationRequest.reason}
                  </div>
                  {selectedBooking.cancellationRequest.adminNotes && (
                    <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                      <strong>Admin Notes:</strong> {selectedBooking.cancellationRequest.adminNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Show reschedule request details if exists */}
              {selectedBooking?.rescheduleRequest?.status === 'pending' && (
                <div style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  background: '#e3f2fd', 
                  borderRadius: 12,
                  border: '2px solid #2196f3'
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1565c0', marginBottom: 12 }}>
                    📅 Reschedule Request Pending
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Reason:</strong> {selectedBooking.rescheduleRequest.reason}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Proposed New Date:</strong> {new Date(selectedBooking.rescheduleRequest.proposedDate).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Description:</strong> {selectedBooking.rescheduleRequest.description}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginTop: 12 }}>
                    Your reschedule request is being reviewed by the admin.
                  </div>
                </div>
              )}

              {selectedBooking?.rescheduleRequest?.status === 'rejected' && (
                <div style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  background: '#ffebee', 
                  borderRadius: 12,
                  border: '2px solid #c62828'
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#c62828', marginBottom: 12 }}>
                    ❌ Reschedule Request Denied
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Your Reason:</strong> {selectedBooking.rescheduleRequest.reason}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Proposed Date:</strong> {new Date(selectedBooking.rescheduleRequest.proposedDate).toLocaleDateString()}
                  </div>
                  {selectedBooking.rescheduleRequest.adminNotes && (
                    <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                      <strong>Admin Notes:</strong> {selectedBooking.rescheduleRequest.adminNotes}
                    </div>
                  )}
                </div>
              )}

              {selectedBooking?.rescheduleRequest?.status === 'approved' && (
                <div style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  background: '#e8f5e9', 
                  borderRadius: 12,
                  border: '2px solid #4caf50'
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2e7d32', marginBottom: 12 }}>
                    ✅ Reschedule Request Approved
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>Original Date:</strong> {new Date(selectedBooking.rescheduleRequest.originalDate).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                    <strong>New Date:</strong> {new Date(selectedBooking.rescheduleRequest.proposedDate).toLocaleDateString()}
                  </div>
                  {selectedBooking.rescheduleRequest.adminNotes && (
                    <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 8 }}>
                      <strong>Admin Notes:</strong> {selectedBooking.rescheduleRequest.adminNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancellationModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2147483649,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowCancellationModal(false)}
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
                ×
              </button>
              
              <h2 style={{fontWeight: 800, fontSize: '1.5rem', marginBottom: 8, color: '#c62828'}}>
                Request Booking Cancellation
              </h2>
              <p style={{fontSize: '0.9rem', color: '#666', marginBottom: 24}}>
                Please provide the reason for your cancellation request. This will be reviewed by our admin team.
              </p>

              {/* Warning Message */}
              <div style={{
                background: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24
              }}>
                <div style={{fontWeight: 600, color: '#e65100', marginBottom: 8}}>⚠️ Important Notice:</div>
                <ul style={{margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#666'}}>
                  <li>Cancellation requests are subject to admin approval</li>
                  <li>Refunds will be processed according to our cancellation policy</li>
                  <li>Processing may take 3-5 business days</li>
                </ul>
              </div>
              
              {/* Reason Dropdown */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Reason for Cancellation <span style={{color: '#e53935'}}>*</span>
                </label>
                <select
                  value={cancellationForm.reason}
                  onChange={(e) => setCancellationForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Select a reason</option>
                  {cancellationReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Description Textarea */}
              <div style={{marginBottom: 24}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Additional Details <span style={{color: '#e53935'}}>*</span>
                </label>
                <textarea
                  value={cancellationForm.description}
                  onChange={(e) => setCancellationForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide more details about your cancellation request..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              <button
                style={{
                  background: cancellationForm.reason && cancellationForm.description.trim()
                    ? 'linear-gradient(90deg, #e53935 0%, #d32f2f 100%)' 
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: cancellationForm.reason && cancellationForm.description.trim() ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.2s',
                  color: '#fff'
                }}
                disabled={!cancellationForm.reason || !cancellationForm.description.trim()}
                onClick={handleSubmitCancellation}
              >
                Submit Cancellation Request
              </button>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 2147483648,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              width: '90%',
              maxWidth: 600,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              {/* Header */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 700, color: '#1976d2', margin: 0}}>
                  📅 Request Booking Reschedule
                </h2>
                <button 
                  onClick={() => setShowRescheduleModal(false)} 
                  style={{
                    background: 'none', 
                    border: 'none', 
                    fontSize: 32, 
                    cursor: 'pointer',
                    color: '#999',
                    lineHeight: 1,
                    padding: 0
                  }}
                >
                  ×
                </button>
              </div>

              {/* Info Text */}
              <p style={{color: '#666', marginBottom: 24, fontSize: '15px'}}>
                Please provide a reason for rescheduling your booking and propose a new date. Our admin team will review your request.
              </p>

              {/* Reason Dropdown */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Reason for Rescheduling <span style={{color: '#1976d2'}}>*</span>
                </label>
                <select
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Select a reason</option>
                  {rescheduleReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Proposed Date Picker */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Proposed New Date <span style={{color: '#1976d2'}}>*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleForm.proposedDate}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, proposedDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              {/* Description Textarea */}
              <div style={{marginBottom: 24}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Additional Details <span style={{color: '#1976d2'}}>*</span>
                </label>
                <textarea
                  value={rescheduleForm.description}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide more details about your reschedule request..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              <button
                style={{
                  background: rescheduleForm.reason && rescheduleForm.proposedDate && rescheduleForm.description.trim()
                    ? 'linear-gradient(90deg, #2196f3 0%, #1976d2 100%)' 
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: rescheduleForm.reason && rescheduleForm.proposedDate && rescheduleForm.description.trim() ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.2s',
                  color: '#fff'
                }}
                disabled={!rescheduleForm.reason || !rescheduleForm.proposedDate || !rescheduleForm.description.trim()}
                onClick={handleSubmitReschedule}
              >
                Submit Reschedule Request
              </button>
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

              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>Add Photos (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{display: 'none'}}
                  id="review-image-upload"
                />
                <label
                  htmlFor="review-image-upload"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#f5f5f5',
                    border: '2px dashed #ccc',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e0e0e0';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.borderColor = '#ccc';
                  }}
                >
                  📷 Upload Images (Max 5)
                </label>
                {reviewImages.length > 0 && (
                  <div style={{display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
                    {reviewImages.map((file, idx) => (
                      <div key={idx} style={{position: 'relative', width: 80, height: 80}}>
                        <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8}} />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            background: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            cursor: 'pointer',
                            fontSize: 14,
                            lineHeight: '24px',
                            padding: 0
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Payment Modal */}
        {showPaymentModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2147483648,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({
                    paymentMode: '',
                    paymentStatus: '',
                    amountPaid: '',
                    paymentDate: '',
                    transactionReference: '',
                    paymentProof: '',
                    paymentNotes: ''
                  });
                  setPaymentProofPreview('');
                }}
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
                ×
              </button>
              
              <h2 style={{fontWeight: 800, fontSize: '1.5rem', marginBottom: 20, color: '#333'}}>Payment Details</h2>
              
              {/* Mode of Payment */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Mode of Payment <span style={{color: '#e53935'}}>*</span>
                </label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="GCash">GCash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>

              {/* Payment Status - Auto-calculated */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Payment Status (Auto-calculated)
                </label>
                <input
                  type="text"
                  value={paymentForm.paymentStatus || 'Pending'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    cursor: 'not-allowed'
                  }}
                />
                <div style={{fontSize: '12px', color: '#666', marginTop: 4, fontStyle: 'italic'}}>
                  Status is automatically set based on amount paid
                </div>
              </div>

              {/* Amount Paid */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Amount Paid (PHP) <span style={{color: '#e53935'}}>*</span>
                </label>
                <input
                  type="number"
                  value={paymentForm.amountPaid}
                  onChange={(e) => {
                    const amountPaid = parseFloat(e.target.value) || 0;
                    const totalPrice = selectedBooking?.totalPrice || 0;
                    let autoStatus = '';
                    
                    if (amountPaid === 0) {
                      autoStatus = 'Pending';
                    } else if (amountPaid >= totalPrice) {
                      autoStatus = 'Fully Paid';
                    } else if (amountPaid > 0 && amountPaid < totalPrice) {
                      autoStatus = 'Partially Paid';
                    }
                    
                    setPaymentForm(prev => ({ 
                      ...prev, 
                      amountPaid: e.target.value,
                      paymentStatus: autoStatus
                    }));
                  }}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
                {selectedBooking && (
                  <div style={{fontSize: '13px', color: '#666', marginTop: 4}}>
                    Total booking amount: PHP {selectedBooking.totalPrice}
                  </div>
                )}
              </div>

              {/* Payment Date */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Payment Date <span style={{color: '#e53935'}}>*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              {/* Transaction Reference */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Transaction Reference Number
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                  placeholder="e.g., TXN123456789, GCash Ref#, Bank Transfer#"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              {/* Payment Proof */}
              <div style={{marginBottom: 20}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Payment Proof (Receipt/Screenshot)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofUpload}
                  style={{display: 'none'}}
                  id="payment-proof-upload"
                />
                <label
                  htmlFor="payment-proof-upload"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    border: '2px dashed #ccc',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚡ Upload Payment Proof
                </label>
                {paymentProofPreview && (
                  <div style={{marginTop: 12, position: 'relative', display: 'inline-block'}}>
                    <img src={paymentProofPreview} alt="Payment Proof Preview" style={{maxWidth: '200px', maxHeight: '150px', borderRadius: 8, border: '2px solid #ddd'}} />
                    <button
                      onClick={handleRemovePaymentProof}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: '24px',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div style={{marginBottom: 24}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#555'}}>
                  Additional Notes
                </label>
                <textarea
                  value={paymentForm.paymentNotes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentNotes: e.target.value }))}
                  placeholder="Any additional payment information..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              <button
                style={{
                  background: paymentForm.paymentMode && paymentForm.paymentStatus && paymentForm.amountPaid && paymentForm.paymentDate 
                    ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)' 
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: paymentForm.paymentMode && paymentForm.paymentStatus && paymentForm.amountPaid && paymentForm.paymentDate ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.2s',
                  color: '#fff'
                }}
                disabled={!paymentForm.paymentMode || !paymentForm.paymentStatus || !paymentForm.amountPaid || !paymentForm.paymentDate}
                onClick={handleSubmitPayment}
              >
                Submit Payment Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingInformation;
