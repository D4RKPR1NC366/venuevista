import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Sidebar from './Sidebar';
import { Calendar as RsuiteCalendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

export default function Dashboard() {
  // Appointment counts
    // For calendar events
    const [calendarEvents, setCalendarEvents] = useState([]);
    const navigate = typeof useNavigate === 'function' ? useNavigate() : null;
    // Fetch calendar events (same logic as Calendars.jsx)
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
          // Map bookings to calendar event format
          const bookingEvents = [...pending, ...approved, ...finished]
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
                title: b.eventType || b.title || 'Booking',
                type: 'Booking',
                person: b.name || b.contact || b.email || '',
                date: dateStr,
                location: b.eventVenue || '',
                description: b.specialRequest || b.details || '',
                status: b.status || '',
              };
            });
          const appointmentEvents = appointments.map(a => {
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
              type: 'Appointment',
              person: a.clientName || a.clientEmail,
              date: dateStr,
              location: a.location || '',
              description: a.description || '',
              status: a.status || '',
            };
          });
          const allEvents = [
            ...(Array.isArray(schedules) ? schedules : []),
            ...(Array.isArray(acceptedSchedules) ? acceptedSchedules : []),
            ...bookingEvents,
            ...appointmentEvents
          ];
          setCalendarEvents(allEvents);
        } catch (err) {
          setCalendarEvents([]);
        }
      }
      fetchEventsAndBookings();
    }, []);
    // Render cell for dashboard calendar (show up to 2 events, then 'more')
    function renderDashboardCell(date) {
      // Show calendar cells numbered 1 through 30 (inclusive).
      // This forces the dashboard calendar to render days 1..30.
      const dayOfMonth = date.getDate();
      if (dayOfMonth < 1 || dayOfMonth > 30) {
        return null;
      }
      // Always render the cell, even if no events
      const d = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const dayEvents = calendarEvents.filter(ev => ev.date === d);
      const maxToShow = 2;
      if (dayEvents.length === 0) {
        // Render empty cell for days with no events
        return <div style={{ marginTop: 4 }}></div>;
      }
      return (
        <div style={{ marginTop: 4, cursor: 'pointer' }}>
          {dayEvents.slice(0, maxToShow).map(ev => (
            <div key={ev._id || ev.id} style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2 }}>
              {ev.title}
            </div>
          ))}
          {dayEvents.length > maxToShow && (
            <div
              key="more"
              style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2, textAlign: 'center', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate && navigate('/admin/calendars')}
              title="View more events"
            >more</div>
          )}
        </div>
      );
    }
  const [upcomingAppointments, setUpcomingAppointments] = useState(null);
  const [finishedAppointments, setFinishedAppointments] = useState(null);
  // Reviews summary
  const [reviewSummary, setReviewSummary] = useState({ avg: 0, total: 0 });
  // Months for chart labels
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  // Helper to get filter label for cards
  function getFilterLabel(filter) {
    if (filter === 'all') return '| all months';
    if (typeof filter === 'number' && filter >= 0 && filter < 12) return `| ${months[filter]}`;
    return '';
  }
  const [pendingEvents, setPendingEvents] = useState(null);
  const [approvedBookings, setApprovedBookings] = useState(null);
  const [finishedBookings, setFinishedBookings] = useState(null);
  const [totalCustomers, setTotalCustomers] = useState(null);
  const [totalSuppliers, setTotalSuppliers] = useState(null);
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [activeSuppliers, setActiveSuppliers] = useState([]);
  // Location-based booking counts
  const [bookingsByLocation, setBookingsByLocation] = useState({
    'Baguio City, Benguet': 0,
    'Sta. Fe, Nueva Vizcaya': 0,
    'Maddela, Quirino': 0,
  });
    // Helper to standardize location names from booking details
    function getStandardLocation(rawLocation) {
      if (!rawLocation) return '';
      const loc = rawLocation.toLowerCase();
      if (loc.includes('baguio')) return 'Baguio City, Benguet';
      if (loc.includes('sta. fe') || loc.includes('stafe') || loc.includes('santa fe')) return 'Sta. Fe, Nueva Vizcaya';
      if (loc.includes('maddela') || loc.includes('quirino')) return 'Maddela, Quirino';
      return rawLocation;
    }
  // Default filter is current month (0-based)
  const [filter, setFilter] = useState(new Date().getMonth());
  const [revenueData, setRevenueData] = useState([]);
  const [urgentReminders, setUrgentReminders] = useState(0);

  // Helper to get start date based on filter
  function getStartDate(filter) {
    const now = new Date();
    if (filter === 'all') {
      return new Date(now.getFullYear(), 0, 1);
    }
    if (typeof filter === 'number' && filter >= 0 && filter < 12) {
      return new Date(now.getFullYear(), filter, 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  useEffect(() => {
            // Fetch reviews summary
            fetch('/api/reviews')
              .then(res => res.json())
              .then(data => {
                const total = Array.isArray(data) ? data.length : 0;
                const avg = total > 0 ? (data.reduce((sum, r) => sum + (r.rating || 0), 0) / total) : 0;
                setReviewSummary({ avg, total });
              })
              .catch(() => setReviewSummary({ avg: 0, total: 0 }));
        // Fetch appointments for upcoming/finished count
        fetch('/api/appointments')
          .then(res => res.json())
          .then(data => {
            const startDate = getStartDate(filter);
            const now = new Date();
            const upcoming = data.filter(a => {
              if (!a.date) return false;
              const d = new Date(a.date);
              return d >= startDate && a.status === 'upcoming';
            }).length;
            const finished = data.filter(a => {
              if (!a.date) return false;
              const d = new Date(a.date);
              return d >= startDate && a.status === 'finished';
            }).length;
            setUpcomingAppointments(upcoming);
            setFinishedAppointments(finished);
          })
          .catch(() => {
            setUpcomingAppointments(0);
            setFinishedAppointments(0);
          });
    // Fetch urgent reminders (schedules and appointments due today or tomorrow)
    Promise.all([
      fetch('/api/schedules'),
      fetch('/api/appointments')
    ])
      .then(([schedRes, apptRes]) => Promise.all([schedRes.json(), apptRes.json()]))
      .then(([schedules, appointments]) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Count urgent schedules
        const urgentSchedules = schedules.filter(sch => {
          if (!sch.date) return false;
          const [year, month, day] = sch.date.split('-').map(Number);
          const schedDate = new Date(year, month - 1, day);
          schedDate.setHours(0,0,0,0);
          return schedDate.getTime() === today.getTime() || schedDate.getTime() === tomorrow.getTime();
        }).length;
        
        // Count urgent appointments
        const urgentAppointments = appointments.filter(appt => {
          if (!appt.date || appt.status !== 'upcoming') return false;
          const [year, month, day] = appt.date.split('-').map(Number);
          const apptDate = new Date(year, month - 1, day);
          apptDate.setHours(0,0,0,0);
          return apptDate.getTime() === today.getTime() || apptDate.getTime() === tomorrow.getTime();
        }).length;
        
        setUrgentReminders(urgentSchedules + urgentAppointments);
      })
      .catch(() => setUrgentReminders(0));
    // Fetch revenue data (monthly, filtered)
    fetch(`/api/revenue?filter=${filter}`)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setRevenueData(data);
        } else {
          console.error('Revenue data is not an array:', data);
          setRevenueData([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching revenue data:', error);
        setRevenueData([]);
      });
    // Fetch pending events
    fetch('/api/bookings/pending')
      .then(res => res.json())
      .then(data => {
        const startDate = getStartDate(filter);
        const count = data.filter(ev => {
          if (!ev.date) return false;
          const d = new Date(ev.date);
          return d >= startDate;
        }).length;
        setPendingEvents(count);
      })
      .catch(() => setPendingEvents(0));

    // Fetch approved bookings
    fetch('/api/bookings/approved')
      .then(res => res.json())
      .then(data => {
        const startDate = getStartDate(filter);
        const count = data.filter(ev => {
          if (!ev.date) return false;
          const d = new Date(ev.date);
          return d >= startDate;
        }).length;
        setApprovedBookings(count);
      })
      .catch(() => setApprovedBookings(0));

    // Fetch finished bookings
    fetch('/api/bookings/finished')
      .then(res => res.json())
      .then(data => {
        const startDate = getStartDate(filter);
        const count = data.filter(ev => {
          if (!ev.date) return false;
          const d = new Date(ev.date);
          return d >= startDate;
        }).length;
        setFinishedBookings(count);
      })
      .catch(() => setFinishedBookings(0));

    // Fetch most active customers (booked within the selected month)
    Promise.all([
      fetch('/api/bookings/pending'),
      fetch('/api/bookings/approved'),
      fetch('/api/bookings/finished')
    ])
      .then(([pendingRes, approvedRes, finishedRes]) => Promise.all([pendingRes.json(), approvedRes.json(), finishedRes.json()]))
      .then(([pending, approved, finished]) => {
        const allBookings = [...pending, ...approved, ...finished];
        const startDate = getStartDate(filter);
        // Only include bookings within the filter month
        const filteredBookings = allBookings.filter(b => {
          if (!b.date || !b.customer) return false;
          const d = new Date(b.date);
          return d >= startDate;
        });
        // Count bookings per customer
        const customerCounts = {};
        filteredBookings.forEach(b => {
          const customerId = b.customer?._id || b.customer?.id || b.customer;
          const customerName = b.customer?.name || b.customer?.fullName || b.customer?.email || b.customer;
          const customerEmail = b.customer?.email || '';
          if (!customerId) return;
          if (!customerCounts[customerId]) {
            customerCounts[customerId] = {
              customerId,
              customerName,
              customerEmail,
              count: 0
            };
          }
          customerCounts[customerId].count++;
        });
        // Convert to array and sort by count desc
        const activeList = Object.values(customerCounts).sort((a, b) => b.count - a.count);
        setActiveCustomers(activeList);
        setTotalCustomers(activeList.length);
      })
      .catch(() => {
        setTotalCustomers(0);
        setActiveCustomers([]);
      });

    // Fetch most active suppliers (booked within the selected month)
    Promise.all([
      fetch('/api/bookings/pending'),
      fetch('/api/bookings/approved'),
      fetch('/api/bookings/finished')
    ])
      .then(([pendingRes, approvedRes, finishedRes]) => Promise.all([pendingRes.json(), approvedRes.json(), finishedRes.json()]))
      .then(([pending, approved, finished]) => {
        const allBookings = [...pending, ...approved, ...finished];
        const startDate = getStartDate(filter);
        // Only include bookings within the filter month
        const filteredBookings = allBookings.filter(b => {
          if (!b.date || !b.supplier) return false;
          const d = new Date(b.date);
          return d >= startDate;
        });
        // Count bookings per supplier
        const supplierCounts = {};
        filteredBookings.forEach(b => {
          const supplierId = b.supplier?._id || b.supplier?.id || b.supplier;
          const supplierName = b.supplier?.companyName || b.supplier?.name || b.supplier?.email || b.supplier;
          const supplierEmail = b.supplier?.email || '';
          const supplierPhone = b.supplier?.phone || b.supplier?.contactNumber || '';
          if (!supplierId) return;
          if (!supplierCounts[supplierId]) {
            supplierCounts[supplierId] = {
              supplierId,
              supplierName,
              supplierEmail,
              supplierPhone,
              count: 0
            };
          }
          supplierCounts[supplierId].count++;
        });
        // Convert to array and sort by count desc
        const activeList = Object.values(supplierCounts).sort((a, b) => b.count - a.count);
        setActiveSuppliers(activeList);
        setTotalSuppliers(activeList.length);
      })
      .catch(() => {
        setTotalSuppliers(0);
        setActiveSuppliers([]);
      });

    // Fetch bookings by location
    Promise.all([
      fetch('/api/bookings/pending'),
      fetch('/api/bookings/approved'),
      fetch('/api/bookings/finished')
    ])
      .then(([pendingRes, approvedRes, finishedRes]) => Promise.all([pendingRes.json(), approvedRes.json(), finishedRes.json()]))
      .then(([pending, approved, finished]) => {
        const allBookings = [...pending, ...approved, ...finished];
        const startDate = getStartDate(filter);
        
        const locationCounts = {
          'sta fe nueva vizcaya': 0,
          'benguet baguio': 0,
          'maddela quirino': 0,
        };

        allBookings.forEach(booking => {
          if (!booking.date) return;
          const d = new Date(booking.date);
          if (d < startDate) return;
          
          const location = (booking.eventVenue || '').toLowerCase().trim();
          Object.keys(locationCounts).forEach(loc => {
            if (location.includes(loc.replace(' ', ''))) {
              locationCounts[loc]++;
            }
          });
        });

        setBookingsByLocation(locationCounts);
      })
      .catch(() => setBookingsByLocation({
        'sta fe nueva vizcaya': 0,
        'benguet baguio': 0,
        'maddela quirino': 0,
      }));
  }, [filter]);

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ fontWeight: 500, marginRight: 8 }}>Show:</label>
            <select
              value={filter}
              onChange={e => {
                const val = e.target.value;
                setFilter(val === 'all' ? 'all' : Number(val));
              }}
              style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', color: '#222', background: '#fff', outline: 'none', boxShadow: 'none' }}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
              <option value="all">All Months</option>
            </select>
          </div>
        </div>

        {/* Reviews and Reminders cards above calendar */}
        <div className="admin-dashboard-cards-row" style={{ marginBottom: 18 }}>
          <div className="admin-dashboard-card" style={{ background: 'linear-gradient(90deg, #f59e42 60%, #f43f5e 100%)', color: '#fff' }}>
            <div className="admin-dashboard-card-title" style={{ color: '#fff', fontWeight: 700 }}>Reviews Summary</div>
            <div className="admin-dashboard-card-value" style={{ color: '#fff', fontWeight: 600, fontSize: '1.2rem' }}>
              {reviewSummary.avg.toFixed(1)} <span style={{ color: '#ffd700', fontSize: '1.2em', marginLeft: '2px' }}>★</span>
              <span style={{ color: '#fff', fontWeight: 400, fontSize: '1rem', marginLeft: '10px' }}>{reviewSummary.total} reviews</span>
            </div>
          </div>
          <div className="admin-dashboard-card" style={{ background: 'linear-gradient(90deg, #f43f5e 60%, #f59e42 100%)', color: '#fff' }}>
            <div className="admin-dashboard-card-title" style={{ color: '#fff', fontWeight: 700 }}>Urgent Reminders <span style={{ color: '#fff', fontWeight: 400 }}>| due today or tomorrow</span></div>
            <div className="admin-dashboard-card-value" style={{ color: '#fff' }}>{urgentReminders}</div>
          </div>
        </div>

        {/* Calendar container and three empty cards in a row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 18, marginBottom: 18 }}>
          <div className="dashboard-calendar-container" style={{ flex: '3 1 0', maxWidth: '75%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: '#111', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', position: 'relative', overflow: 'hidden', minHeight: 540, height: 'auto' }}>
            {/* Removed Go to Calendar button, calendar will use the space above */}
            <div style={{ width: '100%', minHeight: 420, height: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <RsuiteCalendar
                bordered
                style={{ width: '100%', height: '100%', minHeight: 0, background: '#fff', color: '#111' }}
                renderCell={renderDashboardCell}
                cellClassName={() => 'dashboard-custom-calendar-cell'}
              />
            </div>
          </div>
          {/* Three empty cards */}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="admin-dashboard-card" style={{ height: 200, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div className="admin-dashboard-card-title">Sta Fe, Nueva Vizcaya <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
              <div className="admin-dashboard-card-value" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#3b82f6', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{bookingsByLocation['sta fe nueva vizcaya'] !== null ? bookingsByLocation['sta fe nueva vizcaya'] : '-'}</div>
            </div>
            <div className="admin-dashboard-card" style={{ height: 200, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div className="admin-dashboard-card-title">Benguet, Baguio <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
              <div className="admin-dashboard-card-value" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#3b82f6', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{bookingsByLocation['benguet baguio'] !== null ? bookingsByLocation['benguet baguio'] : '-'}</div>
            </div>
            <div className="admin-dashboard-card" style={{ height: 200, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div className="admin-dashboard-card-title">Maddela, Quirino <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
              <div className="admin-dashboard-card-value" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#3b82f6', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{bookingsByLocation['maddela quirino'] !== null ? bookingsByLocation['maddela quirino'] : '-'}</div>
            </div>
          </div>
        </div>
    
        
        
        <div className="admin-dashboard-cards-row">
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Pending bookings <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value">{pendingEvents !== null ? pendingEvents : '-'}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Approved bookings <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value">{approvedBookings !== null ? approvedBookings : '-'}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Finished bookings <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value">{finishedBookings !== null ? finishedBookings : '-'}</div>
          </div>
        </div>
        <div className="admin-dashboard-cards-row" style={{ marginTop: 16 }}>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Total Customers <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value">{totalCustomers !== null ? totalCustomers : '-'}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Total Suppliers <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value">{totalSuppliers !== null ? totalSuppliers : '-'}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Upcoming Appointments <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value" style={{ color: '#22c55e', fontWeight: 700 }}>{upcomingAppointments !== null ? upcomingAppointments : '-'}</div>
          </div>
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-title">Finished Appointments <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
            <div className="admin-dashboard-card-value" style={{ color: '#f43f5e', fontWeight: 700 }}>{finishedAppointments !== null ? finishedAppointments : '-'}</div>
          </div>
        </div>

        {/* Customers who booked (filtered) - table format */}
        <div className="admin-dashboard-list-container" style={{ marginTop: 18, marginBottom: 18, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: 16 }}>
          <div className="admin-dashboard-card-title" style={{ color: '#222', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
            Customers Who Booked
            <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, opacity: 0.8 }}>{getFilterLabel(filter)}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Times Booked</th>
              </tr>
            </thead>
            <tbody>
              {activeCustomers.length > 0 ? (
                activeCustomers.map(c => (
                  <tr key={c.customerId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{c.customerName}</td>
                    <td style={{ padding: '8px' }}>{c.customerEmail}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{c.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ color: '#888', textAlign: 'center', padding: '12px' }}>No customers found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Most Active Suppliers (filtered) - table format */}
        <div className="admin-dashboard-list-container" style={{ marginBottom: 18, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: 16 }}>
          <div className="admin-dashboard-card-title" style={{ color: '#222', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
            Most Active Suppliers
            <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, opacity: 0.8 }}>{getFilterLabel(filter)}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Company Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Times Booked</th>
              </tr>
            </thead>
            <tbody>
              {activeSuppliers.length > 0 ? (
                activeSuppliers.map(s => (
                  <tr key={s.supplierId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{s.supplierName}</td>
                    <td style={{ padding: '8px' }}>{s.supplierPhone || '-'}</td>
                    <td style={{ padding: '8px' }}>{s.supplierEmail}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{s.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: '#888', textAlign: 'center', padding: '12px' }}>No suppliers booked for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        

        <div className="admin-dashboard-revenue-card">
          <div className="admin-dashboard-card-title">Annual Revenue Chart</div>
          <div className="admin-dashboard-revenue-chart" style={{ width: '100%', height: '350px', minHeight: '250px' }}>
            {Array.isArray(revenueData) && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={idx => months[idx] || idx} />
                  <YAxis />
                  <Tooltip formatter={value => `₱${value.toLocaleString()}`} labelFormatter={idx => months[idx] || idx} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No revenue data available.</div>
            )}
          </div>
        </div>

        {/* Revenue summary cards (filtered by filter selection) */}
        {Array.isArray(revenueData) && revenueData.length > 0 && (() => {
          let filteredData = revenueData;
          if (typeof filter === 'number' && filter >= 0 && filter < 12) {
            filteredData = revenueData.filter(d => d.month === filter);
          } // 'all' shows all months
          const totalRevenue = filteredData.reduce((sum, d) => sum + (d.value || 0), 0);
          const tax = totalRevenue * 0.12;
          const profit = totalRevenue - tax;
          return (
            <div className="admin-dashboard-cards-row" style={{ marginTop: 16 }}>
              <div className="admin-dashboard-card" style={{ background: 'linear-gradient(90deg, #22c55e 60%, #bbf7d0 100%)', color: '#222' }}>
                <div className="admin-dashboard-card-title">Revenue <span style={{ color: '#fff', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
                  <div className="admin-dashboard-card-value" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>₱{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="admin-dashboard-card" style={{ background: 'linear-gradient(90deg, #f59e42 60%, #fef3c7 100%)', color: '#222' }}>
                <div className="admin-dashboard-card-title">Tax (12%) <span style={{ color: '#fff', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
                  <div className="admin-dashboard-card-value" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>₱{tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="admin-dashboard-card" style={{ background: 'linear-gradient(90deg, #3b82f6 60%, #dbeafe 100%)', color: '#222' }}>
                <div className="admin-dashboard-card-title">Revenue w/o Tax <span style={{ color: '#fff', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
                  <div className="admin-dashboard-card-value" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>₱{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
