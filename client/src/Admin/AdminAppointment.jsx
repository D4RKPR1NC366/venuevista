import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './appointment.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
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
  const now = new Date();
  const upcoming = appointments.filter(
    a => new Date(a.date) >= now && a.status !== 'finished'
  );
  const finished = appointments.filter(
    a => a.status === 'finished' || new Date(a.date) < now
  );

  // NEW: determine which list to show
  const visibleAppointments = filter === "upcoming" ? upcoming : finished;

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-appointment-root">
          <h2 className="admin-appointment-title">Appointments</h2>

          {/* NEW FILTER BUTTONS */}
          <div className="admin-appointment-filter">
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
                        <div><b>Location:</b> {a.location}</div>
                        <div><b>Description:</b> {a.description}</div>
                        <div><b>Status:</b> {a.status}</div>
                        {filter === "upcoming" && a.status !== "finished" && (
                          <button className="admin-appointment-done-btn" onClick={() => handleDone(a._id)}>
                            Done
                          </button>
                        )}
                        {filter === "finished" && (
                          <button className="admin-appointment-done-btn" style={{background:'#d9534f'}} onClick={() => handleDelete(a._id)}>
                            Delete
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
