import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Sidebar from '../Admin/Sidebar';
import { Calendar as RsuiteCalendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import './suppliercalendar.css';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="sc-modal-overlay">
      <div className="sc-modal-content">
        <button className="sc-modal-close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}

const SupplierCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [viewEventsModalOpen, setViewEventsModalOpen] = useState(false);
  const [viewEventsDate, setViewEventsDate] = useState(null);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get logged-in supplier info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  useEffect(() => {
    async function fetchEventsAndBookings() {
      try {
        const [schedulesRes, acceptedRes, pendingRes, approvedRes, finishedRes, appointmentsRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch(`/api/schedules/status/accepted?supplierId=${encodeURIComponent(userEmail)}`),
          fetch('/api/bookings/pending'),
          fetch('/api/bookings/approved'),
          fetch('/api/bookings/finished'),
          fetch('/api/appointments'),
        ]);
        
        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
        const acceptedSchedules = acceptedRes.ok ? await acceptedRes.json() : [];
        const pending = pendingRes.ok ? await pendingRes.json() : [];
        const approved = approvedRes.ok ? await approvedRes.json() : [];
        const finished = finishedRes.ok ? await finishedRes.json() : [];
        const appointments = appointmentsRes.ok ? await appointmentsRes.json() : [];
        
        // Filter pending schedules for this supplier by name or email
        const filteredSchedules = schedules.filter(ev => {
          if (ev.type === 'Supplier') {
            return (ev.person === userEmail || ev.person === userName);
          }
          return false;
        });
        
        // Filter accepted schedules for this supplier
        const filteredAcceptedSchedules = acceptedSchedules.filter(ev => 
          ev.supplierId === userEmail || ev.supplierName === userName || 
          (ev.person === userEmail || ev.person === userName)
        ).map(ev => ({
          ...ev,
          title: `${ev.title} ✓`,
          status: 'accepted'
        }));
        
        // Filter bookings for this supplier
        const allBookings = [...pending, ...approved, ...finished].filter(b => 
          b.supplierEmail === userEmail || b.supplierName === userName
        );
        
        // Filter appointments for this supplier
        const supplierAppointments = appointments.filter(a => 
          a.supplierEmail === userEmail || a.supplierName === userName ||
          (a.supplier && (a.supplier.email === userEmail || a.supplier.name === userName))
        );
        
        // Map bookings to calendar event format
        const bookingEvents = allBookings.filter(b => b.date).map(b => ({
          _id: b._id,
          title: `${b.eventType || b.title || 'Booking'} 📅`,
          type: 'Booking',
          person: b.name || b.contact || b.email || '',
          date: typeof b.date === 'string' ? b.date.slice(0, 10) : dayjs(b.date).format('YYYY-MM-DD'),
          location: b.eventVenue || '',
          description: b.specialRequest || b.details || '',
          status: b.status || '',
        }));
        
        // Map appointments to calendar event format
        const appointmentEvents = supplierAppointments.filter(a => a.date).map(a => ({
          _id: a._id,
          title: `${a.service || 'Appointment'} 🕒`,
          type: 'Appointment',
          person: a.clientName || a.clientEmail || '',
          date: typeof a.date === 'string' ? a.date.slice(0, 10) : dayjs(a.date).format('YYYY-MM-DD'),
          location: a.location || '',
          description: a.notes || a.description || '',
          status: a.status || '',
          time: a.time || '',
        }));
        
        // Combine all events
        setEvents([
          ...filteredSchedules, 
          ...filteredAcceptedSchedules, 
          ...bookingEvents, 
          ...appointmentEvents
        ]);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    if (userEmail) fetchEventsAndBookings();
  }, [userEmail, userName]);

  // Get events for a specific date (compare as string)
  const getEventsForDate = (date) => {
    let d;
    if (typeof date === 'string') {
      d = date;
    } else {
      d = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }
    return events.filter(ev => ev.date === d);
  };

  // Custom render cell for calendar with double-click
  const renderCell = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;
    const maxToShow = 3;
    return (
      <div
        className="sc-calendar-cell"
        onDoubleClick={e => {
          e.stopPropagation();
          setViewEventsDate(date);
          setViewEventsModalOpen(true);
        }}
        title="Double-click to view events"
      >
        {dayEvents.length > maxToShow
          ? ([
              ...dayEvents.slice(0, maxToShow).map(ev => (
                <div key={ev._id || ev.id} className="sc-calendar-event">
                  {ev.title}
                </div>
              )),
              <div key="plus-sign" className="sc-calendar-event sc-calendar-event-plus">+</div>
            ])
          : dayEvents.map(ev => (
              <div key={ev._id || ev.id} className="sc-calendar-event">
                {ev.title}
              </div>
            ))}
      </div>
    );
  };

  return (
    <div className="sc-main-layout">
      <Sidebar />
      <div className="sc-content">
        <h2 className="sc-title">Supplier Calendar</h2>
        <div className="sc-calendar-container">
          {loading ? (
            <div className="sc-loading">Loading...</div>
          ) : (
            <div className="sc-calendar-inner">
              <RsuiteCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                bordered
                className="sc-rsuite-calendar"
                renderCell={renderCell}
              />
            </div>
          )}
        </div>
        {/* Modal for viewing events on a day */}
        <Modal open={viewEventsModalOpen} onClose={() => setViewEventsModalOpen(false)}>
          <h2 className="sc-modal-title">
            Schedule for {viewEventsDate ? (typeof viewEventsDate === 'string' ? viewEventsDate : `${viewEventsDate.getFullYear()}-${String(viewEventsDate.getMonth()+1).padStart(2,'0')}-${String(viewEventsDate.getDate()).padStart(2,'0')}`) : ''}
          </h2>
          <div className="sc-modal-schedule-list">
            {viewEventsDate && getEventsForDate(viewEventsDate).length > 0 ? (
              getEventsForDate(viewEventsDate).map(ev => (
                <div key={ev._id || ev.id} className="sc-modal-schedule-card">
                  <div
                  <div className="sc-modal-schedule-card-main"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setEventDetailsModalOpen(true);
                    }}
                    title="Click to view details"
                  >
                    <div className="sc-modal-schedule-title">{ev.title}</div>
                    <div className="sc-modal-schedule-type">{ev.type}: <span>{ev.person}</span></div>
                    {ev.time && <div className="sc-modal-schedule-time">Time: {ev.time}</div>}
                    <div className="sc-modal-schedule-location">{ev.location}</div>
                    {ev.status && (
                      <div className={`sc-modal-schedule-status status-${ev.status}`}>
                        Status: {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="sc-modal-no-schedule">No schedule for this day.</div>
            )}
          </div>
          {/* Modal for event details */}
          <Modal open={eventDetailsModalOpen} onClose={() => setEventDetailsModalOpen(false)}>
            {selectedEvent && (
              <div className="sc-modal-details">
                <div className="sc-modal-details-accent" />
                <div className="sc-modal-details-main">
                  <h2 className="sc-modal-details-title">{selectedEvent.title}</h2>
                  <div className="sc-modal-details-row"><span>Type:</span> <span>{selectedEvent.type}</span></div>
                  <div className="sc-modal-details-row"><span>Client/Contact:</span> <span>{selectedEvent.person}</span></div>
                  <div className="sc-modal-details-row"><span>Date:</span> <span>{selectedEvent.date}</span></div>
                  {selectedEvent.time && (
                    <div className="sc-modal-details-row"><span>Time:</span> <span>{selectedEvent.time}</span></div>
                  )}
                  <div className="sc-modal-details-row"><span>Location:</span> <span>{selectedEvent.location || 'Not specified'}</span></div>
                  {selectedEvent.status && (
                    <div className="sc-modal-details-row">
                      <span>Status:</span> 
                      <span className={`status-badge status-${selectedEvent.status}`}>
                        {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                      </span>
                    </div>
                  )}
                  <div className="sc-modal-details-row"><span>Description:</span> <span>{selectedEvent.description || 'No additional details'}</span></div>
                </div>
              </div>
            )}
          </Modal>
        </Modal>
      </div>
    </div>
  );
};

export default SupplierCalendar;
