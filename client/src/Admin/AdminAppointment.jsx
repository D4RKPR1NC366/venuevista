import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import './appointment.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MMMM D, YYYY');
}

export default function AdminAppointment() {
    // Handle deleting appointment
    async function handleDelete(id) {
      try {
        const res = await fetch(`/api/appointments/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setAppointments(prev => prev.filter(a => a._id !== id));
        }
      } catch {}
    }
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [branchFilter, setBranchFilter] = useState("all");

  // Handle marking appointment as finished
  async function handleDone(id) {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' })
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a._id === id ? updated : a));
      }
    } catch {}
  }

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      try {
        const res = await fetch('/api/appointments');
        const data = res.ok ? await res.json() : [];
        setAppointments(Array.isArray(data) ? data : []);
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  // Split appointments
  const now = dayjs();
  let upcoming = appointments.filter(
    a => a.status === 'upcoming' && dayjs(a.date).isAfter(now) || dayjs(a.date).isSame(now, 'day')
  );
  let finished = appointments.filter(
    a => a.status === 'finished' || (dayjs(a.date).isBefore(now, 'day') && a.status !== 'upcoming')
  );

  // Filter by branch
  const branchMatch = (branch) => {
    if (branchFilter === 'all') return true;
    const b = (branch || '').toLowerCase();
    if (branchFilter === 'maddela') return b.includes('maddela') && b.includes('quirino');
    if (branchFilter === 'latrinidad') return b.includes('la trinidad') && b.includes('benguet');
    if (branchFilter === 'stafe') return b.includes('sta') && b.includes('fe') && b.includes('nueva vizcaya');
    return true;
  };

  upcoming = upcoming.filter(a => branchMatch(a.branchLocation));
  finished = finished.filter(a => branchMatch(a.branchLocation));

  // NEW: determine which list to show
  const visibleAppointments = filter === "upcoming" ? upcoming : finished;

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-appointment-root">
          <h2 className="admin-appointment-title">Appointments</h2>

          {/* NEW FILTER BUTTONS */}
          <div className="admin-appointment-filter" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <button
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`filter-btn ${filter === "finished" ? "active" : ""}`}
              onClick={() => setFilter("finished")}
            >
              Finished
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontWeight: 500 }}>Branch:</label>
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', color: '#222', background: '#fff', outline: 'none', boxShadow: 'none' }}
              >
                <option value="all">All Branches</option>
                <option value="stafe">Sta. Fe, Nueva Vizcaya</option>
                <option value="latrinidad">La Trinidad, Benguet</option>
                <option value="maddela">Maddela, Quirino</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="admin-appointment-loading">Loading...</div>
          ) : (
            <>
              <section className="admin-appointment-section">
                <h3 className="admin-appointment-section-title">
                  {filter === "upcoming" ? "Upcoming Appointments" : "Finished Appointments"}
                </h3>

                {visibleAppointments.length === 0 ? (
                  <div className="admin-appointment-empty">
                    No {filter} appointments.
                  </div>
                ) : (
                  <ul className="admin-appointment-list">
                    {visibleAppointments.map(a => (
                      <li key={a._id} className={`admin-appointment-card ${filter === "finished" ? "finished" : ""}`}>
                        <div className="admin-appointment-card-title">{a.title || 'Appointment'}</div>
                        <div><b>Name:</b> {a.clientName}</div>
                        <div><b>Email:</b> {a.clientEmail}</div>
                        <div><b>Date:</b> {formatDate(a.date)}</div>
                        <div><b>Meeting Location:</b> {a.location}</div>
                        <div><b>Branch:</b> {a.branchLocation || 'N/A'}</div>
                        <div><b>Description:</b> {a.description}</div>
                        <div><b>Status:</b> {a.status}</div>
                        {filter === "upcoming" && a.status !== "finished" && (
                          <button className="admin-appointment-done-btn" onClick={() => handleDone(a._id)}>
                            Done
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
