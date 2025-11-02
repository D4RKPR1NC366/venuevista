

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ClientSidebar from './ClientSidebar';
import './BookingInformation.css';




const BookingInformation = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user info (match Login.jsx logic)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;

  useEffect(() => {
    async function fetchBookings() {
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
    }
    if (userEmail) fetchBookings();
  }, [userEmail]);

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
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
                >
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h4>{booking.eventType || booking.title}</h4>
                    <div style={{fontSize: '1.05rem', color: '#666'}}>{booking.date ? new Date(booking.date).toLocaleDateString() : ''}</div>
                  </div>
                  <span className="status">
                    Status: {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
        {/* Modal */}
        {showModal && selectedBooking && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <div style={{
              background: '#fff', 
              borderRadius: 10, 
              padding: 32, 
              maxWidth: 1000, 
              width: '95%', 
              maxHeight: '90vh',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)', 
              position: 'relative',
              overflow: 'auto',
              msOverflowStyle: 'none', /* Hide scrollbar for IE and Edge */
              scrollbarWidth: 'none', /* Hide scrollbar for Firefox */
              '&::-webkit-scrollbar': {
                display: 'none' /* Hide scrollbar for Chrome, Safari and Opera */
              }
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
              <div style={{background: '#fffbe6', borderRadius: 12, padding: 16, border: '1px solid #ffe066', minHeight: 60}}>
                {selectedBooking.specialRequest || 'None'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingInformation;
