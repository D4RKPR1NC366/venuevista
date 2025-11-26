
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Simple modal for approve action
function ApproveModal({ open, onClose, onApprove, booking }) {
  const [date, setDate] = useState(null);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  React.useEffect(() => {
    if (open) {
      setDate(null); // Always blank for admin to pick
      setDesc('');
      setLocation('');
    }
  }, [open]);
  if (!open) return null;
  return (
    <div className="approve-modal-overlay">
      <div className="approve-modal-content">
        <h3 className="approve-modal-title">Approve Booking</h3>
        <div className="approve-modal-section">
          <label className="approve-modal-label">Appointment Date</label>
          <div className="approve-modal-datepicker-wrapper">
            <DatePicker
              selected={date}
              onChange={d => setDate(d)}
              placeholderText="Pick a date"
              dateFormat="yyyy-MM-dd"
              className="custom-datepicker-input"
              calendarClassName="custom-datepicker-calendar"
              popperPlacement="bottom"
              showPopperArrow={false}
            />
            <span
              onClick={() => document.querySelector('.custom-datepicker-input')?.focus()}
              className="approve-modal-datepicker-icon"
              tabIndex={0}
              title="Pick a date"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
          </div>
        </div>
        <div className="approve-modal-section">
          <label className="approve-modal-label">Meeting Location</label>
          <input 
            type="text" 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
            placeholder="Enter the meeting location for the client"
            className="approve-modal-input"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
          />
        </div>
        <div className="approve-modal-section">
          <label className="approve-modal-label">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} className="approve-modal-textarea" />
        </div>
        <div className="approve-modal-actions">
          <button type="button" onClick={onClose} className="approve-modal-cancel">Cancel</button>
          <button type="button" onClick={() => onApprove(date, desc, location)} className="approve-modal-approve" disabled={!date || !location}>Approve</button>
        </div>
      </div>
    </div>
  );
}
import Sidebar from './Sidebar';
import BookingDescription from './BookingDescription';
import './booking.css';

export default function AdminBooking() {
  // Bookings state from database
  const [bookings, setBookings] = useState([]);

  // Fetch bookings from backend
  const fetchBookings = async () => {
    try {
      const [pendingRes, approvedRes, finishedRes] = await Promise.all([
        fetch('/api/bookings/pending'),
        fetch('/api/bookings/approved'),
        fetch('/api/bookings/finished'),
      ]);
      const [pending, approved, finished] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        finishedRes.json(),
      ]);
      // Add status to each booking
      const pendingWithStatus = pending.map(b => ({ ...b, status: 'pending' }));
      const approvedWithStatus = approved.map(b => ({ ...b, status: 'approved' }));
      const finishedWithStatus = finished.map(b => ({ ...b, status: 'finished' }));
      setBookings([...pendingWithStatus, ...approvedWithStatus, ...finishedWithStatus]);
    } catch (err) {
      setBookings([]);
    }
  };

  // Fetch on mount
  React.useEffect(() => {
    fetchBookings();
  }, []);
  // Delete booking handler
  const handleDeleteBooking = async (id) => {
    // Find booking to get its status
    const booking = bookings.find(b => b._id === id);
    let endpoint = '';
    if (!booking) return;
    if (booking.status === 'pending') {
      endpoint = `/api/bookings/pending/${id}`;
    } else if (booking.status === 'approved') {
      endpoint = `/api/bookings/approved/${id}`;
    } else if (booking.status === 'finished') {
      endpoint = `/api/bookings/finished/${id}`;
    }
    try {
      // 1. Delete the booking
      await fetch(endpoint, { method: 'DELETE' });
      
      // 2. If approved or finished, also delete the associated appointment
      if (booking.status === 'approved' || booking.status === 'finished') {
        try {
          // Find and delete appointment by bookingId
          const appointmentsRes = await fetch('/api/appointments');
          const appointments = await appointmentsRes.json();
          const relatedAppointment = appointments.find(a => a.bookingId === id);
          
          if (relatedAppointment) {
            await fetch(`/api/appointments/${relatedAppointment._id}`, { method: 'DELETE' });
            console.log('Associated appointment deleted:', relatedAppointment._id);
          }
        } catch (err) {
          console.error('Error deleting associated appointment:', err);
          // Continue anyway - booking is already deleted
        }
      }
      
      setBookings(prev => prev.filter(b => b._id !== id));
      if (selectedBooking && selectedBooking._id === id) setSelectedBooking(null);
    } catch (err) {
      alert('Failed to delete booking. Please try again.');
    }
  };

  // Approve modal state
  const [approveModal, setApproveModal] = useState({ open: false, booking: null });
  const openApproveModal = (booking) => setApproveModal({ open: true, booking });
  const closeApproveModal = () => setApproveModal({ open: false, booking: null });
  const handleApprove = async (date, desc, location) => {
    // Move booking to approved in backend
    const booking = approveModal.booking;
    try {
      // 1. Add to approved bookings in backend
      await fetch('/api/bookings/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          status: 'approved',
          approvedDate: date,
          approvedDesc: desc
        })
      });
      // 2. Remove from pending bookings in backend
      await fetch(`/api/bookings/pending/${booking._id}`, {
        method: 'DELETE'
      });
      // 3. Save appointment to calendar DB with meeting location
      const appointmentRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking._id,
          clientEmail: booking.email,
          clientName: booking.name,
          date: typeof date === 'string' ? date : date.toISOString().slice(0, 10),
          description: desc,
          location: location // Meeting location from admin input
        })
      });
      if (!appointmentRes.ok) {
        throw new Error('Failed to create appointment');
      }
      console.log('Appointment created for client:', booking.email, 'at location:', location);
      // 4. Update frontend state
      setBookings(prev => prev.map(b =>
        b._id === booking._id ? { ...b, status: 'approved', approvedDate: date, approvedDesc: desc } : b
      ));
    } catch (err) {
      alert('Failed to approve booking. Please try again.');
    }
    closeApproveModal();
  };
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [search, setSearch] = useState('');

  const handleOpenModal = (booking) => {
    setSelectedBooking(booking);
  };
  const handleCloseModal = () => {
    setSelectedBooking(null);
  };


  // Filter bookings by status
  let filteredPending = bookings.filter(b => b.status === 'pending');
  let filteredApproved = bookings.filter(b => b.status === 'approved');
  let filteredFinished = bookings.filter(b => b.status === 'finished');
  if (filter === 'pending') {
    filteredApproved = [];
    filteredFinished = [];
  } else if (filter === 'approved') {
    filteredPending = [];
    filteredFinished = [];
  } else if (filter === 'finished') {
    filteredPending = [];
    filteredApproved = [];
  }
  // Further filter by search (booking type or booker name)
  const searchLower = search.trim().toLowerCase();
  if (searchLower) {
    const matchesBooking = b => {
      const type = (b.eventType || b.title || '').toLowerCase();
      const name = (b.name || '').toLowerCase();
      return type.includes(searchLower) || name.includes(searchLower);
    };
    filteredPending = filteredPending.filter(matchesBooking);
    filteredApproved = filteredApproved.filter(matchesBooking);
    filteredFinished = filteredFinished.filter(matchesBooking);
  }

  // Handler to mark an approved booking as finished
  const handleDoneBooking = async (booking) => {
    try {
      // 1. Add to finished bookings in backend
      await fetch('/api/bookings/finished', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...booking, status: 'finished' })
      });
      // 2. Remove from approved bookings in backend
      await fetch(`/api/bookings/approved/${booking._id}`, {
        method: 'DELETE'
      });
      // 3. Update frontend state
      setBookings(prev => prev.map(b =>
        b._id === booking._id ? { ...b, status: 'finished' } : b
      ));
    } catch (err) {
      alert('Failed to mark as finished. Please try again.');
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-booking-root">
          {/* Header Row: Title, Search, and Filter */}
          <div className="admin-booking-header-row">
            <h2 className="admin-booking-title" style={{marginBottom: '-12px'}}>Admin Booking</h2>
            <div className="admin-booking-header-controls">
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-booking-search"
              />
              <label htmlFor="booking-filter" className="admin-booking-filter-label">Show:</label>
              <select
                id="booking-filter"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="admin-booking-filter-select"
              >
                <option value="all">All</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="finished">Finished Only</option>
              </select>
            </div>
          </div>
          {/* Pending Bookings Section */}
          {filteredPending.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Pending Bookings</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 0 }}>
                {filteredPending.map(booking => (
                  <li
                    key={booking._id}
                    className="booking-card booking-card-flex"
                  >
                    <div className="booking-card-info" onClick={() => handleOpenModal(booking)}>
                      <div className="booking-card-title">{booking.eventType || booking.title}</div>
                      <div className="booking-card-booker">Booker: {booking.name || 'N/A'}</div>
                      <div className="booking-card-date">Date: {booking.date ? (typeof booking.date === 'string' ? new Date(booking.date).toLocaleDateString() : new Date(booking.date).toLocaleDateString()) : ''}</div>
                      <div className="booking-card-price" style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 14, color: '#666' }}>Sub Total: <span style={{ fontWeight: 600, color: '#222' }}>PHP {booking.subTotal || booking.totalPrice || 0}</span></div>
                        {booking.discount > 0 && <div style={{ fontSize: 14, color: '#e53935' }}>Discount: <span style={{ fontWeight: 600 }}>- PHP {booking.discount}</span></div>}
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#222', marginTop: 4 }}>Total: PHP {booking.totalPrice || 0}</div>
                      </div>
                    </div>
                    <div className="booking-card-actions">
                      <button
                        type="button"
                        onClick={() => openApproveModal(booking)}
                        className="booking-card-approve"
                        title="Approve booking"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="booking-card-delete"
                        title="Delete booking"
                        aria-label="Delete booking"
                      >
                        <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5.5" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <rect x="9.25" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <rect x="13" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <path d="M4 6.5H16M8.5 3.5H11.5C12.0523 3.5 12.5 3.94772 12.5 4.5V5.5H7.5V4.5C7.5 3.94772 7.94772 3.5 8.5 3.5Z" stroke="#ff4d4f" strokeWidth="1.2" strokeLinecap="round"/>
                          <rect x="3.5" y="6.5" width="13" height="10" rx="2" stroke="#ff4d4f" strokeWidth="1.2"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
        {/* Approve Modal */}
        <ApproveModal
          open={approveModal.open}
          onClose={closeApproveModal}
          onApprove={handleApprove}
          booking={approveModal.booking}
        />
              </ul>
            </div>
          )}
          {/* Approved Bookings Section */}
          {filteredApproved.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Approved Bookings</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 0 }}>
                {filteredApproved.map(booking => (
                  <li
                    key={booking._id}
                    className="booking-card booking-card-flex"
                  >
                    <div className="booking-card-info" onClick={() => handleOpenModal(booking)}>
                      <div className="booking-card-title">{booking.eventType || booking.title}</div>
                      <div className="booking-card-booker">Booker: {booking.name || 'N/A'}</div>
                      <div className="booking-card-date">Date: {booking.date ? (typeof booking.date === 'string' ? new Date(booking.date).toLocaleDateString() : new Date(booking.date).toLocaleDateString()) : ''}</div>
                      <div className="booking-card-price" style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 14, color: '#666' }}>Sub Total: <span style={{ fontWeight: 600, color: '#222' }}>PHP {booking.subTotal || booking.totalPrice || 0}</span></div>
                        {booking.discount > 0 && <div style={{ fontSize: 14, color: '#e53935' }}>Discount: <span style={{ fontWeight: 600 }}>- PHP {booking.discount}</span></div>}
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#222', marginTop: 4 }}>Total: PHP {booking.totalPrice || 0}</div>
                      </div>
                    </div>
                    <div className="booking-card-actions">
                      <button
                        type="button"
                        onClick={() => handleDoneBooking(booking)}
                        className="booking-card-done"
                        title="Mark as finished"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="booking-card-delete"
                        title="Delete booking"
                        aria-label="Delete booking"
                      >
                        <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5.5" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <rect x="9.25" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <rect x="13" y="8.5" width="1.5" height="6" rx="0.75" fill="#ff4d4f"/>
                          <path d="M4 6.5H16M8.5 3.5H11.5C12.0523 3.5 12.5 3.94772 12.5 4.5V5.5H7.5V4.5C7.5 3.94772 7.94772 3.5 8.5 3.5Z" stroke="#ff4d4f" strokeWidth="1.2" strokeLinecap="round"/>
                          <rect x="3.5" y="6.5" width="13" height="10" rx="2" stroke="#ff4d4f" strokeWidth="1.2"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Finished Bookings Section */}
          {filteredFinished.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Finished Bookings</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 0 }}>
                {filteredFinished.map(booking => (
                  <li
                    key={booking._id}
                    className="booking-card"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 64, padding: 10 }}
                  >
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleOpenModal(booking)}
                    >
                      <div style={{ fontWeight: 500, fontSize: 18 }}>{booking.eventType || booking.title}</div>
                      <div style={{ fontSize: 15, marginTop: 2, color: '#444' }}>Booker: {booking.name || 'N/A'}</div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Date: {booking.date ? (typeof booking.date === 'string' ? new Date(booking.date).toLocaleDateString() : new Date(booking.date).toLocaleDateString()) : ''}</div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 14, color: '#666' }}>Sub Total: <span style={{ fontWeight: 600, color: '#222' }}>PHP {booking.subTotal || booking.totalPrice || 0}</span></div>
                        {booking.discount > 0 && <div style={{ fontSize: 14, color: '#e53935' }}>Discount: <span style={{ fontWeight: 600 }}>- PHP {booking.discount}</span></div>}
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#222', marginTop: 4 }}>Total: PHP {booking.totalPrice || 0}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* No bookings message if all are empty */}
          {filteredPending.length === 0 && filteredApproved.length === 0 && filteredFinished.length === 0 && (
            <div style={{ color: '#888', marginBottom: 16 }}>No bookings to show.</div>
          )}
          <BookingDescription
            open={!!selectedBooking}
            onClose={handleCloseModal}
            booking={selectedBooking}
            onSave={() => {
              fetchBookings();
              // Update selected booking with fresh data
              if (selectedBooking) {
                setTimeout(async () => {
                  try {
                    const response = await fetch(`/api/bookings/${selectedBooking._id}`);
                    if (response.ok) {
                      const updated = await response.json();
                      setSelectedBooking(updated);
                    }
                  } catch (err) {
                    console.error('Failed to refresh booking:', err);
                  }
                }, 100);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
