import React, { useEffect, useState } from 'react';
import ClientSidebar from './ClientSidebar';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState([]);
  const [declinedNotifications, setDeclinedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');

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
          filtered = data.filter(rem => rem.type === 'Supplier' && (rem.person === userEmail || rem.person === userName));
          
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
          console.log('Filtered customer schedules:', filtered);
          
          // Add appointments for customers (and admins testing)
          if (appointmentsRes && appointmentsRes.ok) {
            const appointments = await appointmentsRes.json();
            console.log('Raw appointments from API:', appointments);
            console.log('Appointments length:', appointments.length);
            console.log('Current user email:', userEmail);
            
            // Log each appointment to see if emails match
            appointments.forEach(a => {
              console.log(`Appointment: ${a._id}, clientEmail: "${a.clientEmail}", matches: ${a.clientEmail === userEmail}`);
            });
            
            const appointmentNotifications = appointments.map(a => ({
              _id: a._id,
              title: `Appointment - ${a.status || 'upcoming'}`,
              type: 'Appointment',
              person: a.clientName || a.clientEmail || '',
              date: a.date,
              location: a.location || '',
              description: a.description || 'No description provided'
            }));
            
            console.log('Mapped appointment notifications:', appointmentNotifications);
            filtered = [...filtered, ...appointmentNotifications];
            console.log('Final filtered notifications (schedules + appointments):', filtered);
          } else {
            console.log('No appointments response or not OK:', appointmentsRes?.status);
          }
        }

        setNotifications(filtered);
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
        <div className="notification-tabs" style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px'
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

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notification-list">
            {loading ? (
              <div>Loading...</div>
            ) : notifications.length === 0 ? (
              <div>No new notifications found.</div>
            ) : (
              notifications.map((notif) => (
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
                  <h4 style={{marginBottom: '8px'}}>{notif.title}</h4>
                  <p style={{color: '#666', marginBottom: '4px'}}>{notif.description}</p>
                  {notif.location && (
                    <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                  )}
                  <div style={{fontSize: '0.9rem', color: '#888'}}>{formatDate(notif.date)}</div>
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
            ) : (
              acceptedNotifications.map((notif) => (
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
                    <h4 style={{marginBottom: '8px'}}>{notif.title}</h4>
                    <p style={{color: '#666', marginBottom: '4px'}}>{notif.description}</p>
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>{notif.date}</div>
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
            ) : (
              declinedNotifications.map((notif) => (
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
                    <h4 style={{marginBottom: '8px'}}>{notif.title}</h4>
                    <p style={{color: '#666', marginBottom: '4px'}}>{notif.description}</p>
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>{notif.date}</div>
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
