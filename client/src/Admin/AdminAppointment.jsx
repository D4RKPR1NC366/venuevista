import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './appointment.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AdminAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const upcoming = appointments.filter(a => new Date(a.date) >= now && a.status !== 'finished');
  const finished = appointments.filter(a => a.status === 'finished' || new Date(a.date) < now);

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-appointment-root">
          <h2 className="admin-appointment-title">Appointments</h2>
          {loading ? (
            <div className="admin-appointment-loading">Loading...</div>
          ) : (
            <>
              <section className="admin-appointment-section">
                <h3 className="admin-appointment-section-title">Upcoming Appointments</h3>
                {upcoming.length === 0 ? (
                  <div className="admin-appointment-empty">No upcoming appointments.</div>
                ) : (
                  <ul className="admin-appointment-list">
                    {upcoming.map(a => (
                      <li key={a._id} className="admin-appointment-card">
                        <div className="admin-appointment-card-title">{a.title || 'Appointment'}</div>
                        <div><b>Name:</b> {a.clientName}</div>
                        <div><b>Email:</b> {a.clientEmail}</div>
                        <div><b>Date:</b> {formatDate(a.date)}</div>
                        <div><b>Location:</b> {a.location}</div>
                        <div><b>Description:</b> {a.description}</div>
                        <div><b>Status:</b> {a.status}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="admin-appointment-section">
                <h3 className="admin-appointment-section-title">Finished Appointments</h3>
                {finished.length === 0 ? (
                  <div className="admin-appointment-empty">No finished appointments.</div>
                ) : (
                  <ul className="admin-appointment-list">
                    {finished.map(a => (
                      <li key={a._id} className="admin-appointment-card finished">
                        <div className="admin-appointment-card-title">{a.title || 'Appointment'}</div>
                        <div><b>Name:</b> {a.clientName}</div>
                        <div><b>Email:</b> {a.clientEmail}</div>
                        <div><b>Date:</b> {formatDate(a.date)}</div>
                        <div><b>Location:</b> {a.location}</div>
                        <div><b>Description:</b> {a.description}</div>
                        <div><b>Status:</b> {a.status}</div>
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
