
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { formatPHTime, parsePHTime } from '../utils/date';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Simple modal for approve action
function ApproveModal({ open, onClose, onApprove, booking }) {
  const [date, setDate] = useState(null);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  
  React.useEffect(() => {
    if (open && booking) {
      setDate(null); // Always blank for admin to pick
      setDesc('');
      // Pre-populate location with booking's branch location
      setLocation(booking.branchLocation || '');
    }
  }, [open, booking]);
  
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
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', background: '#fff' }}
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
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch bookings from backend
  const fetchBookings = async () => {
    try {
      const [pendingRes, approvedRes, finishedRes, cancelRequestsRes, cancelledRes] = await Promise.all([
        fetch('/api/bookings/pending'),
        fetch('/api/bookings/approved'),
        fetch('/api/bookings/finished'),
        fetch('/api/bookings/cancellation-requests/pending'),
        fetch('/api/bookings/cancelled'),
      ]);
      const [pending, approved, finished, cancelRequests, cancelled] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        finishedRes.json(),
        cancelRequestsRes.json(),
        cancelledRes.json(),
      ]);
      // Add status to each booking
      const pendingWithStatus = pending.map(b => ({ ...b, status: 'pending' }));
      const approvedWithStatus = approved.map(b => ({ ...b, status: 'approved' }));
      const finishedWithStatus = finished.map(b => ({ ...b, status: 'finished' }));
      setBookings([...pendingWithStatus, ...approvedWithStatus, ...finishedWithStatus]);
      setCancellationRequests(cancelRequests);
      setCancelledBookings(cancelled);
    } catch (err) {
      setBookings([]);
      setCancellationRequests([]);
      setCancelledBookings([]);
    }
  };

  // Fetch on mount
  React.useEffect(() => {
    fetchBookings();
  }, []);
  // Delete booking handler
  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }
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
      // Generate reference number: GC-YYYYMMDD-XXXXX (e.g., GC-20251205-A3F9K)
      const generateReferenceNumber = () => {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomStr = '';
        for (let i = 0; i < 5; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `GC-${dateStr}-${randomStr}`;
      };
      
      const referenceNumber = generateReferenceNumber();
      console.log('Generated reference number:', referenceNumber);
      
      // 1. Add to approved bookings in backend with reference number
      // Remove _id so MongoDB generates a new one for approved collection
      const { _id, ...bookingWithoutId } = booking;
      const approvalPayload = {
        ...bookingWithoutId,
        status: 'approved',
        approvedDate: date,
        approvedDesc: desc,
        referenceNumber: referenceNumber
      };
      console.log('📦 Approval payload keys:', Object.keys(approvalPayload));
      console.log('📦 Reference number in payload:', approvalPayload.referenceNumber);
      console.log('📦 Full payload:', JSON.stringify(approvalPayload, null, 2));
      
      const response = await fetch('/api/bookings/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error('Failed to approve booking');
      }
      
      const savedBooking = await response.json();
      console.log('✅ Response from server:', savedBooking);
      console.log('✅ Reference number in response:', savedBooking.referenceNumber);
      console.log('✅ New booking ID:', savedBooking._id);
      // 2. Remove from pending bookings in backend
      await fetch(`/api/bookings/pending/${_id}`, {
        method: 'DELETE'
      });
      // 3. Save appointment to calendar DB with meeting location and branch
      const appointmentRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: savedBooking._id, // Use the new approved booking ID, not the old pending ID
          clientEmail: booking.email,
          clientName: booking.name,
          date: typeof date === 'string' ? date : formatPHTime(date, 'YYYY-MM-DD'),
          description: desc,
          location: location, // Meeting location from admin input
          branchLocation: booking.branchLocation // Branch from booking
        })
      });
      if (!appointmentRes.ok) {
        throw new Error('Failed to create appointment');
      }
      console.log('Appointment created for client:', booking.email, 'at location:', location);
      // 4. Update frontend state with the saved booking from server (includes new _id and reference number)
      setBookings(prev => prev.map(b =>
        b._id === _id ? { ...savedBooking, status: 'approved' } : b
      ));
    } catch (err) {
      alert('Failed to approve booking. Please try again.');
    }
    closeApproveModal();
  };

  // Cancellation request handlers
  const handleReviewCancellation = (booking) => {
    setSelectedCancellation(booking);
    setAdminNotes('');
    setShowCancellationModal(true);
  };

  const handleApproveCancellation = async () => {
    if (!selectedCancellation) return;
    
    try {
      const adminEmail = localStorage.getItem('userEmail') || 'admin@goldust.com';
      const response = await fetch(`/api/bookings/${selectedCancellation._id}/cancel-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, adminNotes })
      });
      
      if (response.ok) {
        alert('Cancellation approved! Booking moved to cancelled.');
        setShowCancellationModal(false);
        setSelectedCancellation(null);
        setAdminNotes('');
        fetchBookings();
      } else {
        alert('Failed to approve cancellation');
      }
    } catch (error) {
      console.error('Error approving cancellation:', error);
      alert('Error approving cancellation');
    }
  };

  const handleRejectCancellation = async () => {
    if (!selectedCancellation) return;
    if (!adminNotes.trim()) {
      alert('Please provide admin notes explaining why the cancellation is rejected');
      return;
    }
    
    try {
      const adminEmail = localStorage.getItem('userEmail') || 'admin@goldust.com';
      const response = await fetch(`/api/bookings/${selectedCancellation._id}/cancel-reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, adminNotes })
      });
      
      if (response.ok) {
        alert('Cancellation request rejected');
        setShowCancellationModal(false);
        setSelectedCancellation(null);
        setAdminNotes('');
        fetchBookings();
      } else {
        alert('Failed to reject cancellation');
      }
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
      alert('Error rejecting cancellation');
    }
  };

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
    const [branchFilter, setBranchFilter] = useState('all'); // 'all', 'maddela', 'latrinidad', 'stafe'
  const [search, setSearch] = useState('');
  const [refSearch, setRefSearch] = useState('');

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
  let filteredCancelled = cancelledBookings;
  if (filter === 'pending') {
    filteredApproved = [];
    filteredFinished = [];
    filteredCancelled = [];
  } else if (filter === 'approved') {
    filteredPending = [];
    filteredFinished = [];
    filteredCancelled = [];
  } else if (filter === 'finished') {
    filteredPending = [];
    filteredApproved = [];
    filteredCancelled = [];
  } else if (filter === 'cancelled') {
    filteredPending = [];
    filteredApproved = [];
    filteredFinished = [];
  }
  // Branch filter
  const branchMatch = (branch, branchFilt) => {
    if (branchFilt === 'all') return true;
    const b = (branch || '').toLowerCase();
    if (branchFilt === 'maddela') return b.includes('maddela') && b.includes('quirino');
    if (branchFilt === 'latrinidad') return b.includes('la trinidad') && b.includes('benguet');
    if (branchFilt === 'stafe') return b.includes('sta') && b.includes('fe') && b.includes('nueva vizcaya');
    return true;
  };
  filteredPending = filteredPending.filter(b => branchMatch(b.branchLocation, branchFilter));
  filteredApproved = filteredApproved.filter(b => branchMatch(b.branchLocation, branchFilter));
  filteredFinished = filteredFinished.filter(b => branchMatch(b.branchLocation, branchFilter));
  filteredCancelled = filteredCancelled.filter(b => branchMatch(b.branchLocation, branchFilter));
  
  // Filter by reference number search (exact or partial match)
  const refSearchTrimmed = refSearch.trim().toUpperCase();
  if (refSearchTrimmed) {
    const matchesRef = b => {
      const ref = (b.referenceNumber || '').toUpperCase();
      return ref.includes(refSearchTrimmed);
    };
    filteredPending = filteredPending.filter(matchesRef);
    filteredApproved = filteredApproved.filter(matchesRef);
    filteredFinished = filteredFinished.filter(matchesRef);
    filteredCancelled = filteredCancelled.filter(matchesRef);
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
    filteredCancelled = filteredCancelled.filter(matchesBooking);
  }

  // Handler to mark an approved booking as finished
  const handleDoneBooking = async (booking) => {
    try {
      console.log('Moving to finished - original booking:', booking);
      console.log('Reference number being preserved:', booking.referenceNumber);
      const currentId = booking._id;
      
      // Remove _id so MongoDB generates a new one for finished collection
      const { _id, ...bookingWithoutId } = booking;
      
      // 1. Add to finished bookings in backend
      const finishedRes = await fetch('/api/bookings/finished', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingWithoutId, status: 'finished' })
      });
      const savedFinished = await finishedRes.json();
      console.log('✅ Finished booking saved with reference:', savedFinished.referenceNumber);
      
      // 2. Remove from approved bookings in backend
      await fetch(`/api/bookings/approved/${currentId}`, {
        method: 'DELETE'
      });
      
      // 3. Update frontend state with saved booking from server
      setBookings(prev => prev.map(b =>
        b._id === currentId ? { ...savedFinished, status: 'finished' } : b
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
                placeholder="Search by name, event type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-booking-search"
                style={{ width: '200px' }}
              />
              <input
                type="text"
                placeholder="Ref # (GC-20251205-A3F9K)"
                value={refSearch}
                onChange={e => setRefSearch(e.target.value)}
                className="admin-booking-search"
                style={{ width: '200px', background: '#f0f9ff', border: '2px solid #3b82f6' }}
                title="Search by reference number"
              />
              <label htmlFor="booking-filter" className="admin-booking-filter-label">Show:</label>
              <select
                id="booking-filter"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="admin-booking-filter-select"
                style={{ marginRight: 8 }}
              >
                <option value="all">All</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="finished">Finished Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
              <label htmlFor="branch-filter" className="admin-booking-filter-label">Branch:</label>
              <select
                id="branch-filter"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="admin-booking-filter-select"
              >
                <option value="all">All Branches</option>
                <option value="maddela">Maddela, Quirino</option>
                <option value="latrinidad">La Trinidad, Benguet</option>
                <option value="stafe">Sta. Fe, Nueva Vizcaya</option>
              </select>
            </div>
          </div>

          {/* Cancellation Requests Section */}
          {cancellationRequests.length > 0 && (
            <div style={{ marginBottom: 36, padding: 20, background: '#fff3e0', borderRadius: 12, border: '2px solid #ff9800' }}>
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16, color: '#e65100', display: 'flex', alignItems: 'center', gap: 10 }}>
                ⚠️ Cancellation Requests 
                <span style={{ 
                  background: '#ff9800', 
                  color: '#fff', 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  fontSize: 16,
                  fontWeight: 700 
                }}>
                  {cancellationRequests.length}
                </span>
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 0 }}>
                {cancellationRequests.map(booking => (
                  <li
                    key={booking._id}
                    style={{ 
                      background: '#fff', 
                      border: '2px solid #ff9800', 
                      borderRadius: 10, 
                      padding: 16, 
                      marginBottom: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                          {booking.eventType} - {booking.name}
                        </div>
                        {booking.referenceNumber && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 8, fontFamily: 'monospace' }}>
                            📋 Ref: {booking.referenceNumber}
                          </div>
                        )}
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          <strong>Event Date:</strong> {booking.date ? formatPHTime(booking.date, 'MM/DD/YYYY') : 'N/A'}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          <strong>Status:</strong> {booking.status}
                        </div>
                        <div style={{ fontSize: 14, color: '#d32f2f', marginBottom: 4, marginTop: 12 }}>
                          <strong>Cancellation Reason:</strong> {booking.cancellationRequest.reason}
                        </div>
                        {booking.cancellationRequest.description && (
                          <div style={{ fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                            "{booking.cancellationRequest.description}"
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                          Requested: {new Date(booking.cancellationRequest.requestedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReviewCancellation(booking)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Review Request
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cancelled Bookings Section */}
          {cancelledBookings.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16, color: '#c62828' }}>🚫 Cancelled Bookings</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 0 }}>
                {cancelledBookings.map(booking => (
                  <li
                    key={booking._id}
                    className="booking-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 64, padding: 10, opacity: 0.8 }}
                  >
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleOpenModal(booking)}
                    >
                      <div style={{ fontWeight: 500, fontSize: 18 }}>{booking.eventType || booking.title}</div>
                      {booking.referenceNumber && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginTop: 4, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          📋 Ref: {booking.referenceNumber}
                        </div>
                      )}
                      <div style={{ fontSize: 15, marginTop: 2, color: '#444' }}>Booker: {booking.name || 'N/A'}</div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Date: {booking.date ? formatPHTime(booking.date, 'MM/DD/YYYY') : ''}</div>
                      <div style={{ fontSize: 14, color: '#c62828', marginTop: 8, fontWeight: 600 }}>
                        Cancellation Reason: {booking.cancellationRequest?.reason || 'N/A'}
                      </div>
                      {booking.cancellationRequest?.adminNotes && (
                        <div style={{ fontSize: 13, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                          Admin Notes: {booking.cancellationRequest.adminNotes}
                        </div>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: '#ffebee',
                          color: '#c62828',
                          border: '1px solid #c62828'
                        }}>
                          ❌ CANCELLED
                        </div>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ffebee';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#e8f5e9';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#e3f2fd';
                            return '#f5f5f5';
                          })(),
                          color: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#3b82f6';
                            return '#666';
                          })(),
                          border: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '1px solid #ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '1px solid #22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '1px solid #3b82f6';
                            return '1px solid #ddd';
                          })()
                        }}>
                          📍 {booking.eventVenue || 'No location'}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                      <div className="booking-card-date">Date: {booking.date ? formatPHTime(booking.date, 'MM/DD/YYYY') : ''}</div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ffebee';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#e8f5e9';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#e3f2fd';
                            return '#f5f5f5';
                          })(),
                          color: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#3b82f6';
                            return '#666';
                          })(),
                          border: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '1px solid #ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '1px solid #22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '1px solid #3b82f6';
                            return '1px solid #ddd';
                          })()
                        }}>
                          📍 {booking.eventVenue || 'No location'}
                        </div>
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
                      {booking.referenceNumber && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 4, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          📋 Ref: {booking.referenceNumber}
                        </div>
                      )}
                      <div className="booking-card-booker">Booker: {booking.name || 'N/A'}</div>
                      <div className="booking-card-date">Date: {booking.date ? formatPHTime(booking.date, 'MM/DD/YYYY') : ''}</div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ffebee';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#e8f5e9';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#e3f2fd';
                            return '#f5f5f5';
                          })(),
                          color: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#3b82f6';
                            return '#666';
                          })(),
                          border: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '1px solid #ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '1px solid #22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '1px solid #3b82f6';
                            return '1px solid #ddd';
                          })()
                        }}>
                          📍 {booking.eventVenue || 'No location'}
                        </div>
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
                      {booking.referenceNumber && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginTop: 4, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          📋 Ref: {booking.referenceNumber}
                        </div>
                      )}
                      <div style={{ fontSize: 15, marginTop: 2, color: '#444' }}>Booker: {booking.name || 'N/A'}</div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Date: {booking.date ? formatPHTime(booking.date, 'MM/DD/YYYY') : ''}</div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ffebee';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#e8f5e9';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#e3f2fd';
                            return '#f5f5f5';
                          })(),
                          color: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '#ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '#22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '#3b82f6';
                            return '#666';
                          })(),
                          border: (() => {
                            const loc = (booking.eventVenue || '').toLowerCase();
                            if (loc.includes('sta. fe') || loc.includes('sta fe') || loc.includes('stafe') || loc.includes('santa fe')) return '1px solid #ef4444';
                            if (loc.includes('la trinidad') || loc.includes('latrinidad')) return '1px solid #22c55e';
                            if (loc.includes('maddela') || loc.includes('quirino')) return '1px solid #3b82f6';
                            return '1px solid #ddd';
                          })()
                        }}>
                          📍 {booking.eventVenue || 'No location'}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* No bookings message if all are empty */}
          {filteredPending.length === 0 && filteredApproved.length === 0 && filteredFinished.length === 0 && filteredCancelled.length === 0 && (
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

          {/* Cancellation Review Modal */}
          {showCancellationModal && selectedCancellation && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.6)',
              zIndex: 2147483649,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                width: '90%',
                maxWidth: 600,
                maxHeight: '90vh',
                overflow: 'auto',
                padding: 30,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 20, color: '#e65100' }}>
                  Review Cancellation Request
                </h2>
                
                <div style={{ marginBottom: 20, padding: 15, background: '#f5f5f5', borderRadius: 8 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
                    {selectedCancellation.eventType} - {selectedCancellation.name}
                  </div>
                  {selectedCancellation.referenceNumber && (
                    <div style={{ fontSize: '0.9rem', color: '#3b82f6', marginBottom: 8, fontFamily: 'monospace', fontWeight: 700 }}>
                      📋 {selectedCancellation.referenceNumber}
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>
                    <strong>Event Date:</strong> {selectedCancellation.date ? formatPHTime(selectedCancellation.date, 'MM/DD/YYYY') : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <strong>Status:</strong> {selectedCancellation.status}
                  </div>
                </div>

                <div style={{ marginBottom: 20, padding: 15, background: '#ffebee', borderRadius: 8, border: '2px solid #e53935' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#c62828', marginBottom: 8 }}>
                    Client's Cancellation Reason:
                  </div>
                  <div style={{ fontSize: '0.95rem', marginBottom: 8 }}>
                    <strong>Reason:</strong> {selectedCancellation.cancellationRequest.reason}
                  </div>
                  {selectedCancellation.cancellationRequest.description && (
                    <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#666' }}>
                      "{selectedCancellation.cancellationRequest.description}"
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: '#999', marginTop: 8 }}>
                    Requested on: {new Date(selectedCancellation.cancellationRequest.requestedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.95rem' }}>
                    Admin Notes {selectedCancellation.cancellationRequest.status === 'rejected' && '(Required for rejection)'}:
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision (required if rejecting)..."
                    style={{
                      width: '100%',
                      minHeight: 100,
                      padding: 12,
                      border: '2px solid #ddd',
                      borderRadius: 8,
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCancellationModal(false);
                      setSelectedCancellation(null);
                      setAdminNotes('');
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f5f5f5',
                      border: '2px solid #ddd',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectCancellation}
                    style={{
                      padding: '10px 20px',
                      background: '#ff9800',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}
                  >
                    ❌ Reject Request
                  </button>
                  <button
                    onClick={handleApproveCancellation}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(90deg, #e53935 0%, #c62828 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}
                  >
                    ✅ Approve Cancellation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
