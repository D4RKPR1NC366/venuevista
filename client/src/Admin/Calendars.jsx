
import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Sidebar from './Sidebar';
import './calendars.css';

import { Calendar as RsuiteCalendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';


function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="calendars-modal-content" style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 350, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 22,
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: '#888',
            lineHeight: 1,
            padding: 0,
            fontWeight: 700
          }}
          aria-label="Close"
        >×</button>
        {children}
      </div>
    </div>
  );
}



export default function Calendars() {
  // RSuite Calendar selected date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  // For viewing events modal
  const [viewEventsModalOpen, setViewEventsModalOpen] = useState(false);
  const [viewEventsDate, setViewEventsDate] = useState(null);
  // For viewing event details
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Bookings state for calendar
  const [bookings, setBookings] = useState([]);

  // Form state
  const [form, setForm] = useState({
    title: '',
    type: 'Supplier',
    person: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    description: ''
  });

    // Customer and Supplier lists
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Fetch customers and suppliers when modal opens
    useEffect(() => {
      if (!modalOpen) return;
      async function fetchLists() {
        try {
          // Fetch customers from /api/customers (matches backend)
          const [custRes, suppRes] = await Promise.all([
            fetch('/api/customers'),
            fetch('/api/suppliers')
          ]);
          const custData = custRes.ok ? await custRes.json() : [];
          const suppData = suppRes.ok ? await suppRes.json() : [];
          setCustomers(Array.isArray(custData) ? custData : []);
          setSuppliers(Array.isArray(suppData) ? suppData : []);
        } catch (err) {
          setCustomers([]);
          setSuppliers([]);
        }
      }
      fetchLists();
    }, [modalOpen]);

  // Load events from backend API and bookings
  useEffect(() => {
    async function fetchEventsAndBookings() {
      try {
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
        setBookings([...pending, ...approved, ...finished]);

        // Map bookings to calendar event format
        const bookingEvents = [...pending, ...approved, ...finished]
          .filter(b => b.date)
          .map(b => {
            let dateStr = '';
            if (typeof b.date === 'string') {
              dateStr = b.date.slice(0, 10);
            } else {
              // Convert Date to YYYY-MM-DD without timezone conversion
              const d = new Date(b.date);
              dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }
            return {
              _id: b._id,
              title: b.eventType || b.title || 'Booking',
              type: 'Booking',
              person: b.name || b.contact || b.email || '',
              date: dateStr,
              location: b.eventVenue || '',
              description: b.specialRequest || b.details || '',
              status: b.status || '',
            };
          });

        // Map appointments to calendar event format
        const appointmentEvents = appointments.map(a => {
          let dateStr = '';
          if (typeof a.date === 'string') {
            dateStr = a.date;
          } else {
            // Convert Date to YYYY-MM-DD without timezone conversion
            const d = new Date(a.date);
            dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          }
          return {
            _id: a._id,
            title: 'Appointment',
            type: 'Appointment',
            person: a.clientName || a.clientEmail,
            date: dateStr,
            location: a.location || '',
            description: a.description || '',
            status: a.status || '',
          };
        });

        // Merge all events: schedules, accepted schedules, booking events, and appointment events
        const allEvents = [
          ...(Array.isArray(schedules) ? schedules : []),
          ...(Array.isArray(acceptedSchedules) ? acceptedSchedules : []),
          ...bookingEvents,
          ...appointmentEvents
        ];
        setEvents(allEvents);
      } catch (err) {
        console.error('Error fetching schedules/bookings/appointments:', err);
      }
    }
    fetchEventsAndBookings();
  }, []);

  // Optionally, remove localStorage saving logic

  // Add event handler (update to POST to backend)
  const handleAddEvent = async (e) => {
    e.preventDefault();
    const newEvent = { ...form };
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      if (!res.ok) throw new Error('Failed to add event');
      const savedEvent = await res.json();
      setEvents(evts => [...evts, savedEvent]);
      setModalOpen(false);
      setForm({ title: '', type: 'Supplier', person: '', date: new Date().toISOString().slice(0, 10), location: '', description: '' });
    } catch (err) {
      console.error('Error adding event:', err);
      // Optionally show error to user
    }
  };

  // Get events for a specific date (compare as string)
  const getEventsForDate = (date) => {
    // date can be Date or string
    let d;
    if (typeof date === 'string') {
      d = date;
    } else {
      // Use local date string, not UTC
      d = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }
    return events.filter(ev => ev.date === d);
  };

    // Delete event handler
    const handleDeleteEvent = async (eventId) => {
      try {
        const res = await fetch(`/api/schedules/${eventId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete event');
        setEvents(evts => evts.filter(ev => ev._id !== eventId));
      } catch (err) {
        console.error('Error deleting event:', err);
        // Optionally show error to user
      }
    };

  // Custom render cell for calendar with double-click
  const renderCell = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;
    const maxToShow = 3;
    return (
      <div
        style={{ marginTop: 4, cursor: 'pointer' }}
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
                <div key={ev._id || ev.id} style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2 }}>
                  {ev.title}
                </div>
              )),
              <div key="plus-sign" style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2, textAlign: 'center', fontWeight: 700 }}>
                +
              </div>
            ])
          : dayEvents.map(ev => (
              <div key={ev._id || ev.id} style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2 }}>
                {ev.title}
              </div>
            ))}
      </div>
    );
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-calendars-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
            <h2 style={{ color: '#111', marginBottom: 0 }}>Calendar of Event</h2>
            <button
              style={{
                background: 'linear-gradient(90deg, #e6b800 0%, #ffbe2e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.45rem 1.2rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px 0 rgba(230, 184, 0, 0.10)',
                marginLeft: 16
              }}
              onClick={() => setModalOpen(true)}
            >
              Add Event/ Schedule/ Reminder
            </button>
          </div>
          <div
            style={{
              height: 600,
              background: '#fff',
              borderRadius: 12,
              marginTop: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              color: '#111',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ flex: 1, width: '100%', height: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <RsuiteCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                bordered
                style={{ width: '100%', height: '100%', minHeight: 0, background: '#fff', color: '#111' }}
                renderCell={renderCell}
              />
            </div>
          </div>
          {/* Modal for adding event */}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <h4 style={{ marginTop: 0 }}>Add Event/ Schedule/ Reminder</h4>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ width: '100%', marginBottom: 0 }}>
                Title:
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: 6, marginTop: 2, marginBottom: 2, background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </label>
              <label style={{ width: '100%', marginBottom: 0 }}>
                Type:
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: 6, marginTop: 2, marginBottom: 2, background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
                >
                  <option>Supplier</option>
                  <option>Customer</option>
                </select>
              </label>
              <label style={{ width: '100%', marginBottom: 0 }}>
                {form.type} Name:
                <Autocomplete
                  freeSolo
                  options={form.type === 'Customer'
                    ? customers.map(c => ({
                        label: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                        value: c.email // Use email for customer person field
                      })
                    )
                    : suppliers.map(s => {
                        const company = s.companyName || s.name || '';
                        const first = s.firstName || '';
                        const last = s.lastName || '';
                        return {
                          label: `${company}${first || last ? ` (${first} ${last})` : ''}`.trim(),
                          value: s.email // Use email for supplier person field
                        };
                      })
                  }
                  getOptionLabel={option => typeof option === 'string' ? option : option.label}
                  value={typeof form.person === 'string' ? form.person : (form.person && form.person.value) || ''}
                  onInputChange={(e, newValue) => setForm(f => ({ ...f, person: newValue }))}
                  onChange={(e, newValue) => setForm(f => ({ ...f, person: (newValue && newValue.value) ? newValue.value : (typeof newValue === 'string' ? newValue : '') }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      placeholder={`Select or type ${form.type.toLowerCase()} name`}
                      InputProps={{
                        ...params.InputProps,
                        style: {
                          fontSize: '1rem', // increased font size for input
                          fontWeight: 500,
                          width: '100%',
                          padding: 0,
                          marginTop: 2,
                          marginBottom: 2,
                          background: '#fff',
                          color: '#111',
                          borderRadius: 4,
                          boxSizing: 'border-box',
                        }
                      }}
                      inputProps={{
                        ...params.inputProps,
                        style: {
                          fontSize: '1rem', // increased font size for placeholder
                          fontWeight: 500,
                          color: '#111',
                        }
                      }}
                      FormHelperTextProps={{
                        style: {
                          fontSize: '1rem',
                        }
                      }}
                    />
                  )}
                  sx={{
                    '& .MuiAutocomplete-listbox': {
                      fontSize: '1rem', // increased font size for dropdown
                      fontWeight: 500,
                      color: '#111',
                    },
                    '& .MuiAutocomplete-option': {
                      fontSize: '1rem', // increased font size for dropdown options
                      fontWeight: 500,
                      color: '#111',
                    },
                  }}
                />
              </label>
              <label style={{ width: '100%', marginBottom: 0 }}>
                Location:
                <input type="text" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: '100%', padding: 6, marginTop: 2, marginBottom: 2, background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </label>
              <label style={{ width: '100%', marginBottom: 0 }}>
                Date:
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dayjs(form.date)}
                    onChange={date => setForm(f => ({ ...f, date: date ? date.format('YYYY-MM-DD') : '' }))}
                    format="MM/DD/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          marginTop: '2px',
                          marginBottom: '2px',
                          background: '#fff',
                          borderRadius: '4px',
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </label>
              <label style={{ width: '100%', marginBottom: 0 }}>
                Description:
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: 6, marginTop: 2, marginBottom: 2, background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </label>
              <button type="submit" style={{ background: 'linear-gradient(90deg, #e6b800 0%, #ffbe2e 100%)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '1rem', padding: '0.45rem 1.2rem', cursor: 'pointer', marginTop: 8 }}>Set Schedule</button>
            </form>
          </Modal>
          {/* Modal for viewing events on a day */}
          <Modal open={viewEventsModalOpen} onClose={() => setViewEventsModalOpen(false)}>
            <h2 style={{ marginTop: 0, marginBottom: 14, fontWeight: 800, fontSize: '1.25rem', color: '#222', letterSpacing: 1 }}>
              Schedule for {viewEventsDate ? (typeof viewEventsDate === 'string' ? viewEventsDate : `${viewEventsDate.getFullYear()}-${String(viewEventsDate.getMonth()+1).padStart(2,'0')}-${String(viewEventsDate.getDate()).padStart(2,'0')}`) : ''}
            </h2>
            <div
              className="modal-schedule-scroll"
              style={{
                minHeight: 40,
                maxHeight: 500,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {viewEventsDate && getEventsForDate(viewEventsDate).length > 0 ? (
                  getEventsForDate(viewEventsDate).map(ev => (
                    <div
                      key={ev.id}
                      style={{
                        background: '#ffe082',
                        color: '#111',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontSize: 13,
                        marginBottom: 0,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        fontWeight: 500,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        maxWidth: 340,
                      }}
                    >
                      <div
                        style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                        onClick={() => {
                          setSelectedEvent(ev);
                          setEventDetailsModalOpen(true);
                        }}
                        title="Click to view details"
                      >
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{ev.title}</div>
                        <div style={{ color: '#555', fontSize: 12, marginBottom: 2 }}>
                          {ev.type}: <span style={{ fontWeight: 600 }}>{ev.person}</span>
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>{ev.location}</div>
                      </div>
                      <IconButton aria-label="delete" size="small" onClick={() => handleDeleteEvent(ev._id)} style={{ marginLeft: 4 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  ))
              ) : (
                <div style={{ color: '#888', fontSize: 14, textAlign: 'center', marginTop: 18 }}>No schedule for this day.</div>
              )}
          {/* Modal for event details */}
          <Modal open={eventDetailsModalOpen} onClose={() => setEventDetailsModalOpen(false)}>
            {selectedEvent && (
              <div
                style={{
                  minWidth: 340,
                  maxWidth: 400,
                  background: '#fff',
                  borderRadius: 16,
                  /* boxShadow removed */
                  padding: '32px 28px 28px 0',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 0
                }}
              >
                {/* Accent bar */}
                <div style={{
                  width: 10,
                  height: '100%',
                  borderRadius: '16px 0 0 16px',
                  background: 'linear-gradient(180deg, #e6b800 0%, #ffbe2e 100%)',
                  marginRight: 18
                }} />
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    marginTop: 0,
                    marginBottom: 18,
                    fontWeight: 900,
                    fontSize: '1.35rem',
                    color: '#222',
                    letterSpacing: 1,
                    background: 'linear-gradient(90deg, #e6b800 0%, #ffbe2e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>{selectedEvent.title}</h2>
                  <div style={{ marginBottom: 14, fontSize: 16 }}>
                    <span style={{ fontWeight: 700, color: '#e6b800' }}>Type:</span> <span style={{ fontWeight: 500, color: '#222' }}>{selectedEvent.type}</span>
                  </div>
                  <div style={{ marginBottom: 14, fontSize: 16 }}>
                    <span style={{ fontWeight: 700, color: '#e6b800' }}>{selectedEvent.type} Name:</span> <span style={{ fontWeight: 500, color: '#222' }}>{selectedEvent.person}</span>
                  </div>
                  <div style={{ marginBottom: 14, fontSize: 16 }}>
                    <span style={{ fontWeight: 700, color: '#e6b800' }}>Date:</span> <span style={{ fontWeight: 500, color: '#222' }}>{selectedEvent.date}</span>
                  </div>
                  <div style={{ marginBottom: 14, fontSize: 16 }}>
                    <span style={{ fontWeight: 700, color: '#e6b800' }}>Location:</span> <span style={{ fontWeight: 500, color: '#222' }}>{selectedEvent.location}</span>
                  </div>
                  <div style={{ marginBottom: 0, fontSize: 16 }}>
                    <span style={{ fontWeight: 700, color: '#e6b800' }}>Description:</span> <span style={{ fontWeight: 500, color: '#222' }}>{selectedEvent.description}</span>
                  </div>
                </div>
              </div>
            )}
          </Modal>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}
