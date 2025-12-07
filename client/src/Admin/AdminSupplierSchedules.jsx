import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './admin-schedules.css';

const AdminSupplierSchedules = () => {
  const [accepted, setAccepted] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Get admin email
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminEmail = user.email;

  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true);
      try {
        const [acceptedRes, declinedRes, cancelledRes, pendingCancellationsRes] = await Promise.all([
          fetch('/api/schedules/status/accepted'),
          fetch('/api/schedules/status/declined'),
          fetch('/api/schedules/status/cancelled'),
          fetch('/api/schedules/cancellation-requests/pending'),
        ]);
        const acceptedData = acceptedRes.ok ? await acceptedRes.json() : [];
        const declinedData = declinedRes.ok ? await declinedRes.json() : [];
        const cancelledData = cancelledRes.ok ? await cancelledRes.json() : [];
        const pendingCancellations = pendingCancellationsRes.ok ? await pendingCancellationsRes.json() : [];
        
        setAccepted(acceptedData);
        setDeclined(declinedData);
        setCancelled(cancelledData);
        setCancellationRequests(pendingCancellations);
      } catch (err) {
        setAccepted([]);
        setDeclined([]);
        setCancelled([]);
        setCancellationRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);


  // Open approval modal
  function handleReviewCancellation(schedule, isApprove) {
    setSelectedRequest({ schedule, isApprove });
    setAdminNotes('');
    setShowApprovalModal(true);
  }

  // Approve cancellation request
  async function handleApproveCancellation() {
    if (!selectedRequest) return;
    
    try {
      const res = await fetch(`/api/schedules/${selectedRequest.schedule._id}/cancel-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          adminNotes
        })
      });
      
      if (res.ok) {
        alert('Cancellation approved! Schedule moved to cancelled.');
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        
        // Refresh data
        const [acceptedRes, cancelledRes, pendingRes] = await Promise.all([
          fetch('/api/schedules/status/accepted'),
          fetch('/api/schedules/status/cancelled'),
          fetch('/api/schedules/cancellation-requests/pending')
        ]);
        
        if (acceptedRes.ok) setAccepted(await acceptedRes.json());
        if (cancelledRes.ok) setCancelled(await cancelledRes.json());
        if (pendingRes.ok) setCancellationRequests(await pendingRes.json());
      } else {
        throw new Error('Failed to approve cancellation');
      }
    } catch (err) {
      alert('Error approving cancellation: ' + err.message);
    }
  }

  // Reject cancellation request
  async function handleRejectCancellation() {
    if (!selectedRequest || !adminNotes.trim()) {
      alert('Please provide a reason for rejection in the admin notes.');
      return;
    }
    
    try {
      const res = await fetch(`/api/schedules/${selectedRequest.schedule._id}/cancel-reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          adminNotes
        })
      });
      
      if (res.ok) {
        alert('Cancellation request rejected.');
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        
        // Refresh data
        const [acceptedRes, pendingRes] = await Promise.all([
          fetch('/api/schedules/status/accepted'),
          fetch('/api/schedules/cancellation-requests/pending')
        ]);
        
        if (acceptedRes.ok) setAccepted(await acceptedRes.json());
        if (pendingRes.ok) setCancellationRequests(await pendingRes.json());
      } else {
        throw new Error('Failed to reject cancellation');
      }
    } catch (err) {
      alert('Error rejecting cancellation: ' + err.message);
    }
  }

  // Delete (admin forcefully cancels)
  async function handleForceCancel(id) {
    if (!window.confirm('Are you sure you want to forcefully cancel this schedule? This will delete it permanently.')) {
      return;
    }
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccepted(prev => prev.filter(sch => sch._id !== id));
        alert('Schedule deleted successfully');
      } else {
        throw new Error('Failed to delete schedule');
      }
    } catch (err) {
      alert('Error deleting schedule: ' + err.message);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Supplier Schedules</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: '600' }}>Branch:</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: '#fff'
              }}
            >
              <option value="all">All</option>
              <option value="sta-fe">Sta. Fe, Nueva Vizcaya</option>
              <option value="la-trinidad">La Trinidad, Benguet</option>
              <option value="maddela">Maddela, Quirino</option>
            </select>
          </div>
        </div>
        <div className="admin-schedules-tabs">
          <button
            onClick={() => setActiveTab('accepted')}
            className={`admin-schedules-tab-btn${activeTab === 'accepted' ? ' active' : ''}`}
          >
            Accepted Schedules
          </button>
          <button
            onClick={() => setActiveTab('cancellation-requests')}
            className={`admin-schedules-tab-btn${activeTab === 'cancellation-requests' ? ' active' : ''}`}
            style={{
              background: activeTab === 'cancellation-requests' ? '#ff9800' : '',
              color: activeTab === 'cancellation-requests' ? '#fff' : ''
            }}
          >
            Cancellation Requests {cancellationRequests.length > 0 && `(${cancellationRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`admin-schedules-tab-btn${activeTab === 'cancelled' ? ' active' : ''}`}
            style={{
              background: activeTab === 'cancelled' ? '#9e9e9e' : '',
              color: activeTab === 'cancelled' ? '#fff' : ''
            }}
          >
            Cancelled Schedules
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
                  {accepted.filter(sch => {
                    if (branchFilter === 'all') return true;
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branchFilter === 'sta-fe') {
                      return branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'));
                    }
                    if (branchFilter === 'la-trinidad') {
                      return branch.includes('la trinidad') || branch.includes('benguet');
                    }
                    if (branchFilter === 'maddela') {
                      return branch.includes('maddela') || branch.includes('quirino');
                    }
                    return true;
                  }).length === 0 ? <div>No accepted schedules.</div> : accepted.filter(sch => {
                    if (branchFilter === 'all') return true;
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branchFilter === 'sta-fe') {
                      return branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'));
                    }
                    if (branchFilter === 'la-trinidad') {
                      return branch.includes('la trinidad') || branch.includes('benguet');
                    }
                    if (branchFilter === 'maddela') {
                      return branch.includes('maddela') || branch.includes('quirino');
                    }
                    return true;
                  }).map(sch => {
                    // Determine border color based on branchLocation
                    let borderColor = '#FFD700'; // Default yellow
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'))) {
                      borderColor = '#FF6B6B'; // Red for Sta. Fe
                    } else if (branch.includes('la trinidad') || branch.includes('benguet')) {
                      borderColor = '#4CAF50'; // Green for La Trinidad
                    } else if (branch.includes('maddela') || branch.includes('quirino')) {
                      borderColor = '#2196F3'; // Blue for Maddela
                    }
                    return (
                    <div key={sch._id} className="admin-schedule-card accepted" style={{borderLeft: `4px solid ${borderColor}`}}>
                      <div><strong>{sch.eventType || sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      {sch.branchLocation && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Branch: {sch.branchLocation}</div>}
                      <div>Date: {sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#4CAF50'}}>Accepted</span></div>
                      
                      {/* Show cancellation request status if exists */}
                      {sch.cancellationRequest?.status === 'pending' && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: '#fff3e0',
                          borderRadius: '4px',
                          border: '1px solid #ff9800'
                        }}>
                          <div style={{fontWeight: '600', color: '#e65100', fontSize: '0.85rem'}}>
                            ⚠️ Cancellation Requested
                          </div>
                          <div style={{fontSize: '0.8rem', color: '#666', marginTop: '4px'}}>
                            <strong>Reason:</strong> {sch.cancellationRequest.reason}
                          </div>
                        </div>
                      )}
                      
                      <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                        <button style={{background:'#f44336',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 24px',fontWeight:'600',cursor:'pointer'}} onClick={() => handleForceCancel(sch._id)}>Delete</button>
                      </div>
                    </div>
                  )})}
                </div>
              </>
            )}
            {activeTab === 'cancellation-requests' && (
              <>
                <div className="admin-schedules-list">
                  {cancellationRequests.length === 0 ? (
                    <div>No pending cancellation requests.</div>
                  ) : (
                    cancellationRequests.map(sch => {
                      let borderColor = '#ff9800';
                      return (
                        <div key={sch._id} className="admin-schedule-card" style={{borderLeft: `4px solid ${borderColor}`, background: '#fff3e0'}}>
                          <div><strong>{sch.eventType || sch.title}</strong></div>
                          {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                          {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                          {sch.branchLocation && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Branch: {sch.branchLocation}</div>}
                          <div>Date: {sch.date}</div>
                          <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                          
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#fff',
                            borderRadius: '6px',
                            border: '1px solid #ff9800'
                          }}>
                            <div style={{fontWeight: '600', color: '#e65100', marginBottom: '8px'}}>
                              Cancellation Request Details:
                            </div>
                            <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '4px'}}>
                              <strong>Reason:</strong> {sch.cancellationRequest?.reason}
                            </div>
                            <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '4px'}}>
                              <strong>Description:</strong> {sch.cancellationRequest?.description}
                            </div>
                            <div style={{fontSize: '0.8rem', color: '#888', marginTop: '6px'}}>
                              Requested by: {sch.cancellationRequest?.requestedBy}
                            </div>
                            <div style={{fontSize: '0.8rem', color: '#888'}}>
                              Requested at: {sch.cancellationRequest?.requestedAt ? new Date(sch.cancellationRequest.requestedAt).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                          
                          <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                            <button 
                              style={{
                                background:'#4CAF50',
                                color:'#fff',
                                border:'none',
                                borderRadius:'4px',
                                padding:'8px 20px',
                                fontWeight:'600',
                                cursor:'pointer'
                              }} 
                              onClick={() => handleReviewCancellation(sch, true)}
                            >
                              ✓ Approve Cancellation
                            </button>
                            <button 
                              style={{
                                background:'#f44336',
                                color:'#fff',
                                border:'none',
                                borderRadius:'4px',
                                padding:'8px 20px',
                                fontWeight:'600',
                                cursor:'pointer'
                              }} 
                              onClick={() => handleReviewCancellation(sch, false)}
                            >
                              ✗ Reject Request
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
            
            {activeTab === 'cancelled' && (
              <>
                <div className="admin-schedules-list">
                  {cancelled.length === 0 ? (
                    <div>No cancelled schedules.</div>
                  ) : (
                    cancelled.map(sch => {
                      let borderColor = '#9e9e9e';
                      return (
                        <div key={sch._id} className="admin-schedule-card" style={{borderLeft: `4px solid ${borderColor}`, background: '#f5f5f5'}}>
                          <div><strong>{sch.eventType || sch.title}</strong></div>
                          {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                          {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                          {sch.branchLocation && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Branch: {sch.branchLocation}</div>}
                          <div>Date: {sch.date}</div>
                          <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                          <div>Status: <span style={{color:'#9e9e9e'}}>Cancelled</span></div>
                          
                          {sch.cancellationRequest && (
                            <div style={{
                              marginTop: '12px',
                              padding: '12px',
                              background: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #9e9e9e'
                            }}>
                              <div style={{fontWeight: '600', color: '#616161', marginBottom: '8px'}}>
                                Cancellation Details:
                              </div>
                              <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '4px'}}>
                                <strong>Reason:</strong> {sch.cancellationRequest.reason}
                              </div>
                              <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '4px'}}>
                                <strong>Description:</strong> {sch.cancellationRequest.description}
                              </div>
                              {sch.cancellationRequest.adminNotes && (
                                <div style={{fontSize: '0.85rem', color: '#666', marginTop: '8px', fontStyle: 'italic'}}>
                                  <strong>Admin Notes:</strong> {sch.cancellationRequest.adminNotes}
                                </div>
                              )}
                              <div style={{fontSize: '0.8rem', color: '#888', marginTop: '6px'}}>
                                Approved by: {sch.cancellationRequest.processedBy}
                              </div>
                            </div>
                          )}
                          
                          <button 
                            style={{
                              marginTop:'12px',
                              background:'#f44336',
                              color:'#fff',
                              border:'none',
                              borderRadius:'4px',
                              padding:'6px 24px',
                              fontWeight:'600',
                              cursor:'pointer'
                            }} 
                            onClick={() => handleDeleteDeclined(sch._id)}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
            
            {activeTab === 'declined' && (
              <>
                <div className="admin-schedules-list">
                  {declined.filter(sch => {
                    if (branchFilter === 'all') return true;
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branchFilter === 'sta-fe') {
                      return branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'));
                    }
                    if (branchFilter === 'la-trinidad') {
                      return branch.includes('la trinidad') || branch.includes('benguet');
                    }
                    if (branchFilter === 'maddela') {
                      return branch.includes('maddela') || branch.includes('quirino');
                    }
                    return true;
                  }).length === 0 ? <div>No declined schedules.</div> : declined.filter(sch => {
                    if (branchFilter === 'all') return true;
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branchFilter === 'sta-fe') {
                      return branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'));
                    }
                    if (branchFilter === 'la-trinidad') {
                      return branch.includes('la trinidad') || branch.includes('benguet');
                    }
                    if (branchFilter === 'maddela') {
                      return branch.includes('maddela') || branch.includes('quirino');
                    }
                    return true;
                  }).map(sch => {
                    // Determine border color based on branchLocation
                    let borderColor = '#FFD700'; // Default yellow
                    const branch = (sch.branchLocation || '').toLowerCase();
                    if (branch.includes('sta') && (branch.includes('fe') || branch.includes('nueva vizcaya'))) {
                      borderColor = '#FF6B6B'; // Red for Sta. Fe
                    } else if (branch.includes('la trinidad') || branch.includes('benguet')) {
                      borderColor = '#4CAF50'; // Green for La Trinidad
                    } else if (branch.includes('maddela') || branch.includes('quirino')) {
                      borderColor = '#2196F3'; // Blue for Maddela
                    }
                    return (
                    <div key={sch._id} className="admin-schedule-card declined" style={{borderLeft: `4px solid ${borderColor}`}}>
                      <div><strong>{sch.eventType || sch.title}</strong></div>
                      {sch.description && <div style={{color:'#666', marginBottom:'2px', whiteSpace:'pre-line'}}>{sch.description}</div>}
                      {sch.location && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Location: {sch.location}</div>}
                      {sch.branchLocation && <div style={{color:'#888', fontSize:'0.97rem', marginBottom:'2px'}}>Branch: {sch.branchLocation}</div>}
                      <div>Date: {sch.date}</div>
                      <div>Supplier: {sch.supplierName || sch.supplierId}</div>
                      <div>Status: <span style={{color:'#f44336'}}>Declined</span></div>
                      <button style={{marginTop:'8px',background:'#f44336',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 24px',fontWeight:'600',cursor:'pointer',display:'inline-block'}} onClick={() => handleDeleteDeclined(sch._id)}>Delete</button>
                    </div>
                  )})}
                </div>
              </>
            )}
          </>
        )}

        {/* Approval/Rejection Modal */}
        {showApprovalModal && selectedRequest && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <h2 style={{
                fontWeight: 800,
                fontSize: '1.5rem',
                marginBottom: '16px',
                color: selectedRequest.isApprove ? '#4CAF50' : '#f44336'
              }}>
                {selectedRequest.isApprove ? '✓ Approve Cancellation' : '✗ Reject Cancellation'}
              </h2>

              <div style={{
                background: '#f5f5f5',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{fontWeight: '600', fontSize: '1rem', marginBottom: '8px'}}>
                  {selectedRequest.schedule.eventType || selectedRequest.schedule.title}
                </div>
                <div style={{fontSize: '0.85rem', color: '#666'}}>
                  Date: {selectedRequest.schedule.date}
                </div>
                <div style={{fontSize: '0.85rem', color: '#666'}}>
                  Supplier: {selectedRequest.schedule.supplierName}
                </div>
                <div style={{fontSize: '0.85rem', color: '#666', marginTop: '8px'}}>
                  <strong>Reason:</strong> {selectedRequest.schedule.cancellationRequest?.reason}
                </div>
              </div>

              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555'}}>
                  Admin Notes {selectedRequest.isApprove ? '' : <span style={{color: '#e53935'}}>*</span>}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={selectedRequest.isApprove 
                    ? "Optional notes about the approval..." 
                    : "Please explain why you're rejecting this cancellation request..."}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{display: 'flex', gap: '12px'}}>
                <button
                  onClick={selectedRequest.isApprove ? handleApproveCancellation : handleRejectCancellation}
                  style={{
                    flex: 1,
                    background: selectedRequest.isApprove ? '#4CAF50' : '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  {selectedRequest.isApprove ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  style={{
                    flex: 1,
                    background: '#9e9e9e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupplierSchedules;
