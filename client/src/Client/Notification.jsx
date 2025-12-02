import React, { useEffect, useState } from 'react';
import ClientSidebar from './ClientSidebar';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState([]);
  const [declinedNotifications, setDeclinedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [timeFilter, setTimeFilter] = useState('1week'); // '1week', '2weeks', '1month'

  // Get logged-in user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;
  // Determine role: if user has explicit role use it, if admin then admin, else if has companyName then supplier, else customer
  const userRole = user.role === 'admin' ? 'admin' : (user.companyName ? 'supplier' : 'customer');

  // Helper function to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  // Filter function based on time range
  const filterByTimeRange = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let endDate = new Date(today);
    if (timeFilter === '1week') {
      endDate.setDate(today.getDate() + 7);
    } else if (timeFilter === '2weeks') {
      endDate.setDate(today.getDate() + 14);
    } else if (timeFilter === '1month') {
      endDate.setMonth(today.getMonth() + 1);
    }

    return items.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate >= today && itemDate <= endDate;
    });
  };

  useEffect(() => {
    async function fetchReminders() {
      try {
        console.log('=== Notification Debug ===');
        console.log('User:', user);
        console.log('User email:', userEmail, 'Role:', userRole);
        console.log('Is customer?', userRole === 'customer');
        
        // Fetch all types of schedules
        const schedulesRes = await fetch('/api/schedules');
        const acceptedRes = userRole === 'supplier' ? await fetch('/api/schedules/status/accepted?supplierId=' + userEmail) : null;
        const declinedRes = userRole === 'supplier' ? await fetch('/api/schedules/status/declined?supplierId=' + userEmail) : null;
        const appointmentsRes = (userRole === 'customer' || userRole === 'admin') ? await fetch('/api/appointments/user/' + encodeURIComponent(userEmail)) : null;
        
        console.log('appointmentsRes:', appointmentsRes, 'Status:', appointmentsRes?.status);

        if (!schedulesRes.ok) throw new Error('Failed to fetch reminders');
        const data = await schedulesRes.json();
        console.log('Schedules data:', data);

        // Get user's name and email
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        let filtered = [];
        if (userRole === 'supplier') {
          // Filter schedules for this supplier that are still pending
          filtered = data.filter(rem => 
            rem.type === 'Supplier' && 
            (rem.person === userEmail || rem.person === userName || rem.supplierId === userEmail) &&
            (!rem.status || rem.status === 'pending')
          );
          // Fetch accepted and declined schedules if supplier
          if (acceptedRes && acceptedRes.ok) {
            const acceptedData = await acceptedRes.json();
            setAcceptedNotifications(acceptedData);
          }
          if (declinedRes && declinedRes.ok) {
            const declinedData = await declinedRes.json();
            setDeclinedNotifications(declinedData);
          }
        } else {
          filtered = data.filter(rem => rem.type === 'Customer' && (rem.person === userEmail || rem.person === userName));
          // Add appointments for customers (and admins testing)
          if (appointmentsRes && appointmentsRes.ok) {
            const appointments = await appointmentsRes.json();
            // Only show appointments that are not finished
            const appointmentNotifications = appointments
              .filter(a => a.status !== 'finished')
              .map(a => ({
                _id: a._id,
                title: `Appointment - ${a.status || 'upcoming'}`,
                type: 'Appointment',
                person: a.clientName || a.clientEmail || '',
                date: a.date,
                location: a.location || '',
                description: a.description || 'No description provided'
              }));
            filtered = [...filtered, ...appointmentNotifications];
          }
        }

        // Filter notifications based on role
        // For suppliers: show all future notifications (no time limit)
        // For customers: show only those within 2 weeks from today
        let finalFiltered = filtered;
        if (userRole === 'customer') {
          const today = new Date();
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(today.getDate() + 14);
          // Check both .date and .eventDate fields for 2-week window
          const isWithinTwoWeeks = (notif) => {
            const dateFields = [notif.date, notif.eventDate];
            return dateFields.some(dateStr => {
              if (!dateStr) return false;
              const d = new Date(dateStr);
              return d >= today && d <= twoWeeksFromNow;
            });
          };
          finalFiltered = filtered.filter(isWithinTwoWeeks);
        }
        setNotifications(finalFiltered);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    if (userEmail) fetchReminders();
  }, [userEmail, userRole]);

  const handleAccept = async (notif) => {
    try {
      console.log('Accepting notification:', notif);
      // Update the schedule status in the database
      const response = await fetch(`/api/schedules/${notif._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'accepted',
          supplierId: userEmail,
          supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Move notification to accepted list
      const updatedNotif = { 
        ...notif, 
        status: 'accepted',
        supplierId: userEmail,
        supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        actionDate: new Date().toISOString()
      };
      setAcceptedNotifications(prev => [...prev, updatedNotif]);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));

      // Refresh the lists
      const [acceptedRes, declinedRes] = await Promise.all([
        fetch('/api/schedules/status/accepted?supplierId=' + userEmail),
        fetch('/api/schedules/status/declined?supplierId=' + userEmail)
      ]);

      if (acceptedRes.ok) {
        const acceptedData = await acceptedRes.json();
        setAcceptedNotifications(acceptedData);
      }
      if (declinedRes.ok) {
        const declinedData = await declinedRes.json();
        setDeclinedNotifications(declinedData);
      }
    } catch (error) {
      console.error('Error accepting notification:', error);
      alert('Failed to accept schedule: ' + error.message);
    }
  };

  const handleDecline = async (notif) => {
    try {
      console.log('Declining notification:', notif);
      // Update the schedule status in the database
      const response = await fetch(`/api/schedules/${notif._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'declined',
          supplierId: userEmail,
          supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Move notification to declined list
      const updatedNotif = { 
        ...notif, 
        status: 'declined',
        supplierId: userEmail,
        supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        actionDate: new Date().toISOString()
      };
      setDeclinedNotifications(prev => [...prev, updatedNotif]);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));

      // Refresh the lists
      const [acceptedRes, declinedRes] = await Promise.all([
        fetch('/api/schedules/status/accepted?supplierId=' + userEmail),
        fetch('/api/schedules/status/declined?supplierId=' + userEmail)
      ]);

      if (acceptedRes.ok) {
        const acceptedData = await acceptedRes.json();
        setAcceptedNotifications(acceptedData);
      }
      if (declinedRes.ok) {
        const declinedData = await declinedRes.json();
        setDeclinedNotifications(declinedData);
      }
    } catch (error) {
      console.error('Error declining notification:', error);
      alert('Failed to decline schedule: ' + error.message);
    }
  };

  return (
    <div className="notification-page">
      <ClientSidebar />
      <div className="notification-content">
        <div style={{ marginBottom: '24px' }}>
          <div className="notification-tabs" style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <button 
              onClick={() => setActiveTab('notifications')}
              style={{
                padding: '8px 16px',
                background: activeTab === 'notifications' ? '#FFD700' : '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal'
              }}
            >
              Notifications
            </button>
            {userRole === 'supplier' && (
              <>
                <button 
                  onClick={() => setActiveTab('accepted')}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === 'accepted' ? '#4CAF50' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: activeTab === 'accepted' ? 'white' : 'black',
                    fontWeight: activeTab === 'accepted' ? 'bold' : 'normal'
                  }}
                >
                  Accepted Schedules
                </button>
                <button 
                  onClick={() => setActiveTab('declined')}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === 'declined' ? '#f44336' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: activeTab === 'declined' ? 'white' : 'black',
                    fontWeight: activeTab === 'declined' ? 'bold' : 'normal'
                  }}
                >
                  Declined Schedules
                </button>
              </>
            )}
          </div>

          {/* Time Filter */}
          {userRole === 'supplier' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Filter by:</span>
              <button
                onClick={() => setTimeFilter('1week')}
                style={{
                  padding: '6px 12px',
                  background: timeFilter === '1week' ? '#FFD700' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: timeFilter === '1week' ? 'bold' : 'normal'
                }}
              >
                1 Week
              </button>
              <button
                onClick={() => setTimeFilter('2weeks')}
                style={{
                  padding: '6px 12px',
                  background: timeFilter === '2weeks' ? '#FFD700' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: timeFilter === '2weeks' ? 'bold' : 'normal'
                }}
              >
                2 Weeks
              </button>
              <button
                onClick={() => setTimeFilter('1month')}
                style={{
                  padding: '6px 12px',
                  background: timeFilter === '1month' ? '#FFD700' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: timeFilter === '1month' ? 'bold' : 'normal'
                }}
              >
                1 Month
              </button>
            </div>
          )}
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notification-list">
            {loading ? (
              <div>Loading...</div>
            ) : notifications.length === 0 ? (
              <div>No new notifications found.</div>
            ) : (
              (userRole === 'supplier' ? filterByTimeRange(notifications) : notifications).map((notif) => (
              <div key={notif._id} className="notification-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{marginBottom: '8px'}}>{notif.eventType || notif.title}</h4>
                  {notif.description && (
                    <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                  )}
                  {notif.location && (
                    <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                  )}
                  <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {formatDate(notif.date)}</div>
                </div>
                {userRole === 'supplier' && (
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      onClick={() => handleAccept(notif)}
                      style={{
                        padding: '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(notif)}
                      style={{
                        padding: '8px 16px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )))}
          </div>
        )}

        {/* Accepted Schedules Tab */}
        {activeTab === 'accepted' && userRole === 'supplier' && (
          <div className="notification-list">
            {acceptedNotifications.length === 0 ? (
              <div>No accepted schedules</div>
            ) : filterByTimeRange(acceptedNotifications).length === 0 ? (
              <div>No accepted schedules in this time range</div>
            ) : (
              filterByTimeRange(acceptedNotifications).map((notif) => (
                <div key={notif._id} className="notification-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f1f8e9',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  borderLeft: '4px solid #4CAF50'
                }}>
                  <div>
                    <h4 style={{marginBottom: '8px'}}>{notif.eventType || notif.title}</h4>
                    {notif.description && (
                      <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                    )}
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {notif.date}</div>
                  </div>
                  <div style={{color: '#4CAF50', fontWeight: '500'}}>Accepted</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Declined Schedules Tab */}
        {activeTab === 'declined' && userRole === 'supplier' && (
          <div className="notification-list">
            {declinedNotifications.length === 0 ? (
              <div>No declined schedules</div>
            ) : filterByTimeRange(declinedNotifications).length === 0 ? (
              <div>No declined schedules in this time range</div>
            ) : (
              filterByTimeRange(declinedNotifications).map((notif) => (
                <div key={notif._id} className="notification-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffebee',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  borderLeft: '4px solid #f44336'
                }}>
                  <div>
                    <h4 style={{marginBottom: '8px'}}>{notif.eventType || notif.title}</h4>
                    {notif.description && (
                      <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                    )}
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {notif.date}</div>
                  </div>
                  <div style={{color: '#f44336', fontWeight: '500'}}>Declined</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
