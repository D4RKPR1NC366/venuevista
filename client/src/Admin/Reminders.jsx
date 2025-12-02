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
  const [filter, setFilter] = useState('1week');

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
              description: b.specialRequest || '',
              status: b.status || '',
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
          description: s.description || '',
        }));

        // Combine all reminders
        setReminders([...scheduleReminders, ...bookingReminders, ...appointmentReminders]);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setReminders([]);
      }
    }
    fetchReminders();
  }, []);
  // Filter reminders based on selected time range
  const getFilteredReminders = () => {
    const now = new Date();
    now.setHours(0,0,0,0); // normalize to midnight
    
    // Determine end date based on filter
    let endDate;
    if (filter === 'all') {
      // Show all future reminders (no upper limit)
      endDate = new Date(2099, 11, 31); // Far future date
    } else if (filter === '1week') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 7);
    } else if (filter === '2week') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 14);
    } else if (filter === '1month') {
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 30);
    } else {
      endDate = new Date(2099, 11, 31);
    }
    
    // Filter reminders: show today and future events within the selected range
    const filtered = reminders.filter(reminder => {
      if (!reminder.date) return false;
      const reminderDate = new Date(reminder.date);
      reminderDate.setHours(0,0,0,0);
      return reminderDate >= now && reminderDate <= endDate;
    });
    
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
            <div className="reminders-header-controls">
              <label className="reminders-filter-label">Show:</label>
              <select
                className="reminders-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="1week">1 Week</option>
                <option value="2week">2 Weeks</option>
                <option value="1month">1 Month</option>
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
                return (
                  <li
                    key={reminder._id}
                    className={`reminder-card${isDueSoon ? ' reminder-card-due-soon' : ''}`}
                    onClick={() => { setSelectedReminder(reminder); setModalOpen(true); }}
                    title="Click to view details"
                  >
                    <div className="reminder-card-title">{reminder.title}</div>
                    <div className="reminder-card-date">Due: {typeof reminder.date === 'string' && reminder.date.includes('T') ? reminder.date.split('T')[0] : reminder.date}</div>
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
