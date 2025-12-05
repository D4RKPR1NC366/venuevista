import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Sidebar from './Sidebar';
import './reminders.css';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="reminder-modal-overlay">
      <div className="reminder-modal">
        <button className="reminder-modal-close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}

export default function Reminders() {
  // Reminders are fetched from schedules and approved bookings
  const [reminders, setReminders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [dateFilter, setDateFilter] = useState('1week');
  const [typeFilter, setTypeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  useEffect(() => {
    async function fetchReminders() {
      try {
        // Fetch all calendar data: schedules, accepted schedules, bookings, and appointments
        const [schedulesRes, acceptedSchedulesRes, pendingRes, approvedRes, finishedRes, appointmentsRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/schedules/status/accepted'),
          fetch('/api/bookings/pending'),
          fetch('/api/bookings/approved'),
          fetch('/api/bookings/finished'),
          fetch('/api/appointments'),
        ]);
        
        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
        const acceptedSchedules = acceptedSchedulesRes.ok ? await acceptedSchedulesRes.json() : [];
        const pending = pendingRes.ok ? await pendingRes.json() : [];
        const approved = approvedRes.ok ? await approvedRes.json() : [];
        const finished = finishedRes.ok ? await finishedRes.json() : [];
        const appointments = appointmentsRes.ok ? await appointmentsRes.json() : [];

        // Map bookings to reminder-like objects
        const allBookings = [...pending, ...approved, ...finished];
        const bookingReminders = allBookings
          .filter(b => b.date)
          .map(b => {
            let dateStr = '';
            if (typeof b.date === 'string') {
              dateStr = b.date.slice(0, 10);
            } else {
              const d = new Date(b.date);
              dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }
            return {
              _id: b._id,
              title: b.eventType || 'Booking',
              date: dateStr,
              type: 'Booking',
              person: b.name || b.contact || b.email || '',
              location: b.eventVenue || '',
              branch: b.branchLocation || '',
              description: b.specialRequest || '',
              status: b.status || '',
            };
          });

        // Create warning reminders for approved bookings without suppliers (within 2 weeks)
        // These warnings will automatically disappear once suppliers are assigned
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);
        
        const missingSupplierReminders = approved
          .filter(b => {
            // CRITICAL: Only show warning if booking CURRENTLY has no suppliers
            // This check happens on every fetch, so warnings disappear when suppliers are assigned
            const hasNoSuppliers = !b.suppliers || b.suppliers.length === 0;
            if (!hasNoSuppliers || !b.date) return false;
            
            // Check if event is within 2 weeks
            const eventDate = new Date(b.date);
            return eventDate >= now && eventDate <= twoWeeksFromNow;
          })
          .map(b => {
            let dateStr = '';
            if (typeof b.date === 'string') {
              dateStr = b.date.slice(0, 10);
            } else {
              const d = new Date(b.date);
              dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }
            return {
              _id: `warning-${b._id}`,
              title: `⚠️ Missing Suppliers: ${b.eventType || 'Booking'}`,
              date: dateStr,
              type: 'Warning',
              person: b.name || b.contact || b.email || '',
              location: b.eventVenue || '',
              branch: b.branchLocation || '',
              description: `This booking has no assigned suppliers yet. Event date: ${dateStr}. Please assign suppliers soon.`,
              status: 'urgent',
              originalBookingId: b._id,
            };
          });

        // Map appointments to reminder-like objects
        const appointmentReminders = appointments.map(a => {
          let dateStr = '';
          if (typeof a.date === 'string') {
            dateStr = a.date;
          } else {
            const d = new Date(a.date);
            dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          }
          return {
            _id: a._id,
            title: 'Appointment',
            date: dateStr,
            type: 'Appointment',
            person: a.clientName || a.clientEmail || '',
            location: a.location || '',
            branch: a.branchLocation || '',
            description: a.description || '',
            status: a.status || '',
          };
        });

        // Map schedules to have consistent format
        const scheduleReminders = [
          ...(Array.isArray(schedules) ? schedules : []),
          ...(Array.isArray(acceptedSchedules) ? acceptedSchedules : [])
        ].map(s => ({
          ...s,
          type: s.type || 'Schedule',
          title: s.title || s.type || 'Schedule',
          person: s.person || '',
          location: s.location || '',
          branch: s.branchLocation || '',
          description: s.description || '',
        }));

        // Combine all reminders including missing supplier warnings
        setReminders([...scheduleReminders, ...bookingReminders, ...appointmentReminders, ...missingSupplierReminders]);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setReminders([]);
      }
    }
    fetchReminders();
    
    // Auto-refresh reminders every 30 seconds to update supplier warnings
    const intervalId = setInterval(fetchReminders, 30000);
    return () => clearInterval(intervalId);
  }, []);
  // Filter reminders based on selected time range and type
  const getFilteredReminders = () => {
    const now = new Date();
    now.setHours(0,0,0,0); // normalize to midnight
    // Determine end date based on filter
    let endDate;
    if (dateFilter === 'all') {
      endDate = new Date(2099, 11, 31);
    } else if (dateFilter === '1week') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 7);
    } else if (dateFilter === '2week') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 14);
    } else if (dateFilter === '1month') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 30);
    } else {
      endDate = new Date(2099, 11, 31);
    }
    // Filter reminders: show today and future events within the selected range
    let filtered = reminders.filter(reminder => {
      if (!reminder.date) return false;
      const reminderDate = new Date(reminder.date);
      reminderDate.setHours(0,0,0,0);
      return reminderDate >= now && reminderDate <= endDate;
    });
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(reminder => {
        if (typeFilter === 'booking') return reminder.type === 'Booking';
        if (typeFilter === 'schedule') return reminder.type === 'Schedule' || reminder.type === 'Supplier';
        if (typeFilter === 'appointment') return reminder.type === 'Appointment';
        if (typeFilter === 'warning') return reminder.type === 'Warning';
        return true;
      });
    }
    // Filter by branch (matching branchLocation field)
    if (branchFilter !== 'all') {
      filtered = filtered.filter(reminder => {
        const branch = (reminder.branch || '').toLowerCase();
        if (branchFilter === 'sta-fe') {
          return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
        }
        if (branchFilter === 'la-trinidad') {
          return branch.includes('la trinidad') && branch.includes('benguet');
        }
        if (branchFilter === 'maddela') {
          return branch.includes('maddela') && branch.includes('quirino');
        }
        return true;
      });
    }
    // Sort by soonest date first
    return filtered.slice().sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-reminders-root">
          <div className="reminders-header">
            <h2>Reminders</h2>
            <div className="reminders-header-controls" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label className="reminders-filter-label">Date Range:</label>
              <select
                className="reminders-filter-select"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="1week">1 Week</option>
                <option value="2week">2 Weeks</option>
                <option value="1month">1 Month</option>
              </select>
              <label className="reminders-filter-label">Type:</label>
              <select
                className="reminders-filter-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="booking">Booking Event Date</option>
                <option value="schedule">Supplier Schedules</option>
                <option value="appointment">Customer Appointments</option>
                <option value="warning">⚠️ Missing Suppliers</option>
              </select>
              <label className="reminders-filter-label">Branch:</label>
              <select
                className="reminders-filter-select"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="sta-fe">Sta. Fe, Nueva Vizcaya</option>
                <option value="la-trinidad">La Trinidad, Benguet</option>
                <option value="maddela">Maddela, Quirino</option>
              </select>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
            {getFilteredReminders().length === 0 ? (
              <li style={{ color: '#888', fontSize: 16, textAlign: 'center', marginTop: 18 }}>No reminders found.</li>
            ) : (
              getFilteredReminders().map(reminder => {
                // Calculate if due today or tomorrow (urgent)
                let dueLabel = '';
                let isDueSoon = false;
                if (reminder.date) {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  const dayAfterTomorrow = new Date(today);
                  dayAfterTomorrow.setDate(today.getDate() + 2);
                  const reminderDate = new Date(reminder.date);
                  reminderDate.setHours(0,0,0,0);
                  if (reminderDate.getTime() === today.getTime()) {
                    isDueSoon = true;
                    dueLabel = 'Due Today';
                  } else if (reminderDate.getTime() === tomorrow.getTime()) {
                    isDueSoon = true;
                    dueLabel = 'Due Tomorrow';
                  } else if (reminderDate.getTime() === dayAfterTomorrow.getTime()) {
                    isDueSoon = true;
                    dueLabel = 'Due in 2 Days';
                  }
                }
                const isWarning = reminder.type === 'Warning';
                return (
                  <li
                    key={reminder._id}
                    className={`reminder-card${isDueSoon ? ' reminder-card-due-soon' : ''}`}
                    style={isWarning ? { 
                      background: 'linear-gradient(135deg, #ffebee 0%, #ffccbc 100%)', 
                      border: '3px solid #d32f2f',
                      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                    } : {}}
                    onClick={() => { setSelectedReminder(reminder); setModalOpen(true); }}
                    title="Click to view details"
                  >
                    <div className="reminder-card-title" style={isWarning ? { color: '#b71c1c', fontWeight: 800 } : {}}>{reminder.title}</div>
                    <div className="reminder-card-date" style={isWarning ? { color: '#c62828', fontWeight: 600 } : {}}>Due: {typeof reminder.date === 'string' && reminder.date.includes('T') ? reminder.date.split('T')[0] : reminder.date}</div>
                    {isDueSoon && (
                      <div className="reminder-card-due-label">{dueLabel}</div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            {selectedReminder && (
              <div className="reminder-modal-details">
                <h2 className="reminder-modal-title">{selectedReminder.title}</h2>
                <div className="reminder-modal-row"><span className="reminder-modal-label">Type:</span> <span className="reminder-modal-value">{selectedReminder.type}</span></div>
                <div className="reminder-modal-row"><span className="reminder-modal-label">{selectedReminder.type} Name:</span> <span className="reminder-modal-value">{selectedReminder.person}</span></div>
                <div className="reminder-modal-row"><span className="reminder-modal-label">Date:</span> <span className="reminder-modal-value">{typeof selectedReminder.date === 'string' && selectedReminder.date.includes('T') ? selectedReminder.date.split('T')[0] : selectedReminder.date}</span></div>
                <div className="reminder-modal-row"><span className="reminder-modal-label">Location:</span> <span className="reminder-modal-value">{selectedReminder.location}</span></div>
                <div className="reminder-modal-row"><span className="reminder-modal-label">Description:</span> <span className="reminder-modal-value">{selectedReminder.description}</span></div>
              </div>
            )}
          </Modal>
        </div>
      </main>
    </div>
  );
}
