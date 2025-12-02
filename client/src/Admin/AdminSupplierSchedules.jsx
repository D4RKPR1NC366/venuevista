import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './admin-schedules.css';

const AdminSupplierSchedules = () => {
  const [accepted, setAccepted] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');

  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true);
      try {
        const [acceptedRes, declinedRes] = await Promise.all([
          fetch('/api/schedules/status/accepted'),
          fetch('/api/schedules/status/declined'),
        ]);
        const acceptedData = acceptedRes.ok ? await acceptedRes.json() : [];
        const declinedData = declinedRes.ok ? await declinedRes.json() : [];
        setAccepted(acceptedData);
        setDeclined(declinedData);
      } catch (err) {
        setAccepted([]);
        setDeclined([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);


  // Cancel accepted schedule
  async function handleCancel(id) {
    if (!window.confirm('Are you sure you want to cancel this accepted schedule?')) {
      return;
    }
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccepted(prev => prev.filter(sch => sch._id !== id));
        alert('Schedule cancelled successfully');
      } else {
        throw new Error('Failed to cancel schedule');
      }
    } catch (err) {
      alert('Error cancelling schedule: ' + err.message);
    }
  }

  // Delete accepted schedule
  async function handleDeleteAccepted(id) {
    if (!window.confirm('Are you sure you want to permanently delete this accepted schedule?')) {
      return;
    }
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccepted(prev => prev.filter(sch => sch._id !== id));
        alert('Accepted schedule deleted successfully');
      } else {
        throw new Error('Failed to delete accepted schedule');
      }
    } catch (err) {
      alert('Error deleting accepted schedule: ' + err.message);
    }
  }

  // Delete declined schedule
  async function handleDeleteDeclined(id) {
    if (!window.confirm('Are you sure you want to delete this declined schedule?')) {
      return;
    }
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeclined(prev => prev.filter(sch => sch._id !== id));
        alert('Declined schedule deleted successfully');
      } else {
        throw new Error('Failed to delete declined schedule');
      }
    } catch (err) {
      alert('Error deleting declined schedule: ' + err.message);
    }
  }

  return (
    <div className="admin-schedules-layout">
      <Sidebar />
      <div className="admin-schedules-page">
        <div className="admin-schedules-tabs">
          <button
            onClick={() => setActiveTab('accepted')}
            className={`admin-schedules-tab-btn${activeTab === 'accepted' ? ' active' : ''}`}
          >
            Accepted Schedules
          </button>
          <button
            onClick={() => setActiveTab('declined')}
            className={`admin-schedules-tab-btn${activeTab === 'declined' ? ' active declined' : ''}`}
          >
            Declined Schedules
          </button>
        </div>
        {loading ? <div>Loading schedules...</div> : (
          <>
            {activeTab === 'accepted' && (
              <>
                <div className="admin-schedules-list">
                  {accepted.length === 0 ? <div>No accepted schedules.</div> : accepted.map(sch => (
                    <div key={sch._id} className="admin-schedule-card accepted">
                      <div><strong>{sch.eventType || sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      <div>Date: {sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#4CAF50'}}>Accepted</span></div>
                      <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                        <button style={{background:'#f44336',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 24px',fontWeight:'600',cursor:'pointer'}} onClick={() => handleCancel(sch._id)}>Cancel</button>
                        <button style={{background:'#9e9e9e',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 24px',fontWeight:'600',cursor:'pointer'}} onClick={() => handleDeleteAccepted(sch._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {activeTab === 'declined' && (
              <>
                <div className="admin-schedules-list">
                  {declined.length === 0 ? <div>No declined schedules.</div> : declined.map(sch => (
                    <div key={sch._id} className="admin-schedule-card declined">
                      <div><strong>{sch.eventType || sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      <div>Date: {sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#f44336'}}>Declined</span></div>
                      <button style={{marginTop:'8px',background:'#f44336',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 24px',fontWeight:'600',cursor:'pointer',display:'inline-block'}} onClick={() => handleDeleteDeclined(sch._id)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupplierSchedules;
