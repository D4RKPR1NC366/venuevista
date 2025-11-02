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
                      <div><strong>{sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      <div>{sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#4CAF50'}}>Accepted</span></div>
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
                      <div><strong>{sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      <div>{sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#f44336'}}>Declined</span></div>
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
