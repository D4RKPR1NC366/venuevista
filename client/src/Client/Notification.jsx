import React, { useEffect, useState } from 'react';
import ClientSidebar from './ClientSidebar';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState([]);
  const [declinedNotifications, setDeclinedNotifications] = useState([]);
  const [cancelledNotifications, setCancelledNotifications] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [timeFilter, setTimeFilter] = useState('1week'); // '1week', '2weeks', '1month'

  // Cancellation modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedScheduleToCancel, setSelectedScheduleToCancel] = useState(null);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    description: ''
  });

  // Schedule cancellation reasons
  const scheduleCancellationReasons = [
    'Personal Emergency',
    'Conflicting Schedule',
    'Resource Unavailability',
    'Health Issues',
    'Transportation Issues',
    'Business Closure',
    'Other'
  ];

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

  // Helper function to calculate days until event
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get due message
  const getDueMessage = (dateStr) => {
    const days = getDaysUntil(dateStr);
    if (days === null) return '';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days === 1) return 'Due Tomorrow';
    if (days <= 7) return `Due in ${days} days`;
    return '';
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
      // Skip time filter for pending supplier schedules
      if (item.ignoreTimeFilter) return true;
      
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
        
        // Get user's name
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        
        // Fetch all types of events: schedules, accepted schedules, bookings, appointments, and notifications
        const [schedulesRes, acceptedSchedulesRes, declinedSchedulesRes, cancelledSchedulesRes, upcomingSchedulesRes, pendingRes, approvedRes, finishedRes, appointmentsRes, notificationsRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/schedules/status/accepted'),
          userRole === 'supplier' ? fetch('/api/schedules/status/declined?supplierId=' + userEmail) : Promise.resolve({ ok: false }),
          userRole === 'supplier' ? fetch('/api/schedules/status/cancelled?supplierId=' + userEmail) : Promise.resolve({ ok: false }),
          userRole === 'supplier' ? fetch('/api/schedules/status/upcoming?supplierId=' + userEmail) : Promise.resolve({ ok: false }),
          fetch('/api/bookings/pending'),
          fetch('/api/bookings/approved'),
          fetch('/api/bookings/finished'),
          fetch('/api/appointments/user/' + encodeURIComponent(userEmail)),
          fetch('/api/notifications'),
        ]);

        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
        const acceptedSchedules = acceptedSchedulesRes.ok ? await acceptedSchedulesRes.json() : [];
        const declinedSchedules = declinedSchedulesRes.ok ? await declinedSchedulesRes.json() : [];
        const cancelledSchedules = cancelledSchedulesRes.ok ? await cancelledSchedulesRes.json() : [];
        const upcomingSchedulesData = upcomingSchedulesRes.ok ? await upcomingSchedulesRes.json() : [];
        const pending = pendingRes.ok ? await pendingRes.json() : [];
        const approved = approvedRes.ok ? await approvedRes.json() : [];
        const finished = finishedRes.ok ? await finishedRes.json() : [];
        const appointments = appointmentsRes.ok ? await appointmentsRes.json() : [];
        const notificationsData = notificationsRes.ok ? await notificationsRes.json() : [];
        
        // Set upcoming schedules
        if (userRole === 'supplier') {
          console.log('Upcoming schedules fetched:', upcomingSchedulesData);
          console.log('Supplier email for query:', userEmail);
          setUpcomingSchedules(upcomingSchedulesData);
        }

        console.log('Fetched data:', { schedules, acceptedSchedules, pending, approved, finished, appointments, notificationsData });

        // Filter notifications for this user (customer or supplier)
        const userNotifications = notificationsData.filter(notif => {
          if (userRole === 'supplier') {
            return notif.type === 'Supplier' && 
                   (notif.person === userEmail || notif.person === userName);
          } else {
            return notif.type === 'Customer' && 
                   (notif.person === userEmail || notif.person === userName);
          }
        }).map(notif => ({
          ...notif,
          type: 'Notification',
          title: notif.title,
          description: notif.description || '',
          date: notif.date,
          location: notif.location || ''
        }));

        let filtered = [];
        
        if (userRole === 'supplier') {
          // For suppliers: show ALL pending schedules assigned to them (no time filter on pending)
          const pendingSchedules = schedules.filter(rem => 
            rem.type === 'Supplier' && 
            (rem.person === userEmail || rem.person === userName || rem.supplierId === userEmail) &&
            (!rem.status || rem.status === 'pending')
          ).map(rem => ({
            ...rem,
            ignoreTimeFilter: true // Mark to bypass time filter
          }));
          
          console.log('Pending schedules for supplier:', pendingSchedules);
          
          // Get accepted schedules for supplier
          const userAcceptedSchedules = acceptedSchedules.filter(ev => 
            ev.type === 'Supplier' && 
            (ev.person === userEmail || ev.person === userName || ev.supplierId === userEmail)
          );
          
          // Show ALL accepted schedules in notifications (time filter applied later in UI)
          const acceptedSchedulesForNotif = userAcceptedSchedules.map(ev => ({ ...ev, status: 'accepted' }));
          
          console.log('Accepted schedules for supplier:', acceptedSchedulesForNotif);
          
          // Get bookings for this supplier (all statuses)
          // For suppliers, check if they are in the suppliers array or match by company name
          const allBookings = [...pending, ...approved, ...finished].filter(b => {
            // Check if user email/name matches
            if (b.email === userEmail || b.name === userName) return true;
            // Check if supplier is in the suppliers array
            if (b.suppliers && Array.isArray(b.suppliers)) {
              return b.suppliers.some(s => 
                s.email === userEmail || 
                s.companyName === user.companyName ||
                s.name === userName
              );
            }
            // Check if booking has supplier info matching this user
            if (b.supplierEmail === userEmail || b.supplierName === userName) return true;
            if (b.companyName && user.companyName && b.companyName === user.companyName) return true;
            return false;
          });
          const bookingEvents = allBookings.filter(b => b.date).map(b => ({
            _id: b._id,
            title: b.eventType || b.title || 'Booking',
            type: 'Booking',
            person: b.name || b.contact || b.email || '',
            date: typeof b.date === 'string' ? b.date.slice(0, 10) : new Date(b.date).toISOString().slice(0, 10),
            location: b.eventVenue || '',
            description: b.specialRequest || b.details || '',
            status: b.status || '',
            eventType: b.eventType
          }));
          
          // Get appointments for this supplier
          const appointmentEvents = appointments.map(a => ({
            _id: a._id,
            title: 'Appointment',
            type: 'Appointment',
            person: a.clientName || a.clientEmail || '',
            date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().slice(0, 10),
            location: a.location || '',
            description: a.description || 'No description provided',
            status: a.status || ''
          }));
          
          // Combine all events for suppliers - show ALL pending and accepted schedules + notifications
          filtered = [...pendingSchedules, ...acceptedSchedulesForNotif, ...bookingEvents, ...appointmentEvents, ...userNotifications];
          
          console.log('Combined filtered notifications:', filtered);
          
          // Set all accepted schedules for the accepted tab
          setAcceptedNotifications(userAcceptedSchedules);
          
          const userDeclinedSchedules = declinedSchedules.filter(ev => 
            ev.type === 'Supplier' && 
            (ev.person === userEmail || ev.person === userName || ev.supplierId === userEmail)
          );
          setDeclinedNotifications(userDeclinedSchedules);

          const userCancelledSchedules = cancelledSchedules.filter(ev => 
            ev.type === 'Supplier' && 
            (ev.person === userEmail || ev.person === userName || ev.supplierId === userEmail)
          );
          setCancelledNotifications(userCancelledSchedules);
        } else {
          // For customers: show all their events (schedules, accepted schedules, bookings, appointments)
          
          // 1. Pending schedules
          const userSchedules = schedules.filter(rem => 
            rem.type === 'Customer' && 
            (rem.person === userEmail || rem.person === userName)
          );
          
          // 2. Get all accepted schedules
          const allUserAcceptedSchedules = acceptedSchedules.filter(ev => 
            ev.type === 'Customer' && 
            (ev.person === userEmail || ev.person === userName)
          ).map(ev => ({ ...ev, status: 'accepted' }));
          
          // Filter accepted schedules within 1 week for main notifications
          const acceptedWithin1Week = allUserAcceptedSchedules.filter(ev => {
            const days = getDaysUntil(ev.date);
            return days !== null && days >= 0 && days <= 7;
          });
          
          // 3. Bookings (all statuses)
          const allBookings = [...pending, ...approved, ...finished].filter(b => 
            b.email === userEmail || b.name === userName
          );
          const bookingEvents = allBookings.filter(b => b.date).map(b => ({
            _id: b._id,
            title: b.eventType || b.title || 'Booking',
            type: 'Booking',
            person: b.name || b.contact || b.email || '',
            date: typeof b.date === 'string' ? b.date.slice(0, 10) : new Date(b.date).toISOString().slice(0, 10),
            location: b.eventVenue || '',
            description: b.specialRequest || b.details || '',
            status: b.status || '',
            eventType: b.eventType
          }));
          
          // 4. Appointments
          const appointmentEvents = appointments.map(a => ({
            _id: a._id,
            title: 'Appointment',
            type: 'Appointment',
            person: a.clientName || a.clientEmail || '',
            date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().slice(0, 10),
            location: a.location || '',
            description: a.description || 'No description provided',
            status: a.status || ''
          }));
          
          filtered = [...userSchedules, ...acceptedWithin1Week, ...bookingEvents, ...appointmentEvents, ...userNotifications];
        }

        console.log('Filtered notifications:', filtered);
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

  const handleRequestCancel = (schedule) => {
    setSelectedScheduleToCancel(schedule);
    setCancelForm({ reason: '', description: '' });
    setShowCancelModal(true);
  };

  const handleSubmitCancellation = async () => {
    if (!cancelForm.reason || !cancelForm.description.trim()) {
      alert('Please provide both a reason and description for cancellation.');
      return;
    }

    try {
      const response = await fetch(`/api/schedules/${selectedScheduleToCancel._id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelForm.reason,
          description: cancelForm.description,
          supplierEmail: userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request cancellation');
      }

      alert('Cancellation request submitted successfully! Admin will review your request.');
      setShowCancelModal(false);
      setSelectedScheduleToCancel(null);
      setCancelForm({ reason: '', description: '' });

      // Refresh accepted schedules
      const acceptedRes = await fetch('/api/schedules/status/accepted?supplierId=' + userEmail);
      if (acceptedRes.ok) {
        const acceptedData = await acceptedRes.json();
        setAcceptedNotifications(acceptedData);
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      alert('Failed to request cancellation: ' + error.message);
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
                  onClick={() => setActiveTab('upcoming')}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === 'upcoming' ? '#2196F3' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: activeTab === 'upcoming' ? 'white' : 'black',
                    fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal'
                  }}
                >
                  Upcoming Schedules
                </button>
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
                <button 
                  onClick={() => setActiveTab('cancelled')}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === 'cancelled' ? '#9e9e9e' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: activeTab === 'cancelled' ? 'white' : 'black',
                    fontWeight: activeTab === 'cancelled' ? 'bold' : 'normal'
                  }}
                >
                  Cancelled Schedules
                </button>
              </>
            )}
          </div>

          {/* Time Filter - Available for all users */}
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
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notification-list">
            {loading ? (
              <div>Loading...</div>
            ) : notifications.length === 0 ? (
              <div>No new notifications found.</div>
            ) : filterByTimeRange(notifications).length === 0 ? (
              <div>No notifications in this time range.</div>
            ) : (
              filterByTimeRange(notifications).map((notif) => (
              <div key={notif._id} className="notification-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px',
                borderLeft: `4px solid ${
                  notif.type === 'Booking' ? '#2196F3' : 
                  notif.type === 'Appointment' ? '#9C27B0' : 
                  notif.type === 'Notification' ? '#FF9800' : 
                  notif.status === 'accepted' ? '#4CAF50' : '#FFD700'
                }`
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{margin: 0}}>{notif.eventType || notif.title}</h4>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: notif.type === 'Booking' ? '#E3F2FD' : 
                                notif.type === 'Appointment' ? '#F3E5F5' : 
                                notif.type === 'Notification' ? '#FFF3E0' : '#FFF9C4',
                      color: notif.type === 'Booking' ? '#1976D2' : 
                            notif.type === 'Appointment' ? '#7B1FA2' : 
                            notif.type === 'Notification' ? '#E65100' : '#F57F17'
                    }}>
                      {notif.type}
                    </span>
                    {notif.status && notif.status !== 'pending' && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: notif.status === 'accepted' ? '#E8F5E9' : 
                                  notif.status === 'approved' ? '#E8F5E9' : 
                                  notif.status === 'finished' ? '#E0E0E0' : '#FFF9C4',
                        color: notif.status === 'accepted' ? '#2E7D32' : 
                              notif.status === 'approved' ? '#2E7D32' : 
                              notif.status === 'finished' ? '#424242' : '#F57F17'
                      }}>
                        {notif.status}
                      </span>
                    )}
                    {getDueMessage(notif.date) && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: getDaysUntil(notif.date) === 0 ? '#FFEBEE' : 
                                  getDaysUntil(notif.date) === 1 ? '#FFF3E0' : '#E3F2FD',
                        color: getDaysUntil(notif.date) === 0 ? '#C62828' : 
                              getDaysUntil(notif.date) === 1 ? '#E65100' : '#1565C0',
                        fontWeight: 'bold'
                      }}>
                        {getDueMessage(notif.date)}
                      </span>
                    )}
                  </div>
                  {notif.description && (
                    <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                  )}
                  {notif.location && (
                    <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                  )}
                  <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {formatDate(notif.date)}</div>
                </div>
                {userRole === 'supplier' && notif.type === 'Supplier' && (
                  <>
                    {(!notif.status || notif.status === 'pending') && (
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
                    {notif.status === 'accepted' && (
                      <div style={{
                        padding: '8px 16px',
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        Accepted
                      </div>
                    )}
                    {notif.status === 'declined' && (
                      <div style={{
                        padding: '8px 16px',
                        background: '#FFEBEE',
                        color: '#C62828',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        Declined
                      </div>
                    )}
                  </>
                )}
              </div>
            )))}
          </div>
        )}

        {/* Upcoming Schedules Tab */}
        {activeTab === 'upcoming' && userRole === 'supplier' && (
          <div className="notification-list">
            {upcomingSchedules.length === 0 ? (
              <div>No upcoming schedules</div>
            ) : (
              upcomingSchedules.map((schedule) => (
                <div key={schedule._id} className="notification-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#e3f2fd',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  border: '2px solid #2196F3'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px', color: '#1565c0' }}>
                      {schedule.eventType}
                    </div>
                    {schedule.description && (
                      <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: '6px' }}>
                        {schedule.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                      <strong>Date:</strong> {formatDate(schedule.eventDate)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                      <strong>Scheduled Time:</strong> {schedule.scheduledTime}
                    </div>
                    {schedule.arriveEarly && (
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#e65100', 
                        marginBottom: '4px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        background: '#fff3e0',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        ⚠️ Arrive 1 day early
                      </div>
                    )}
                    {schedule.branch && (
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                        <strong>Branch:</strong> {schedule.branch}
                      </div>
                    )}
                    {schedule.venue && (
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                        <strong>Venue:</strong> {schedule.venue}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/schedules/upcoming/${schedule._id}/accept`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              supplierId: userEmail,
                              supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            })
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to accept schedule');
                          }
                          
                          // Remove from upcoming and refresh
                          setUpcomingSchedules(prev => prev.filter(s => s._id !== schedule._id));
                          alert('Schedule accepted successfully!');
                        } catch (error) {
                          console.error('Error accepting schedule:', error);
                          alert('Failed to accept schedule: ' + error.message);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/schedules/upcoming/${schedule._id}/decline`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              supplierId: userEmail,
                              supplierName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            })
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to decline schedule');
                          }
                          
                          // Remove from upcoming and refresh
                          setUpcomingSchedules(prev => prev.filter(s => s._id !== schedule._id));
                          alert('Schedule declined successfully!');
                        } catch (error) {
                          console.error('Error declining schedule:', error);
                          alert('Failed to decline schedule: ' + error.message);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
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
                  background: notif.cancellationRequest?.status === 'pending' ? '#fff3e0' : '#f1f8e9',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  borderLeft: notif.cancellationRequest?.status === 'pending' ? '4px solid #ff9800' : '4px solid #4CAF50'
                }}>
                  <div style={{flex: 1}}>
                    <h4 style={{marginBottom: '8px'}}>{notif.eventType || notif.title}</h4>
                    {notif.description && (
                      <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                    )}
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {notif.date}</div>
                    
                    {/* Show cancellation request info if pending */}
                    {notif.cancellationRequest?.status === 'pending' && (
                      <div style={{marginTop: '12px', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #ff9800'}}>
                        <div style={{fontWeight: '600', color: '#e65100', fontSize: '0.85rem', marginBottom: '4px'}}>
                          ⚠️ Cancellation Pending Review
                        </div>
                        <div style={{fontSize: '0.8rem', color: '#666'}}>
                          Reason: {notif.cancellationRequest.reason}
                        </div>
                      </div>
                    )}

                    {notif.cancellationRequest?.status === 'rejected' && (
                      <div style={{marginTop: '12px', padding: '10px', background: '#ffebee', borderRadius: '6px', border: '1px solid #c62828'}}>
                        <div style={{fontWeight: '600', color: '#c62828', fontSize: '0.85rem', marginBottom: '4px'}}>
                          ❌ Cancellation Denied
                        </div>
                        {notif.cancellationRequest.adminNotes && (
                          <div style={{fontSize: '0.8rem', color: '#666'}}>
                            Admin: {notif.cancellationRequest.adminNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginLeft: '16px'}}>
                    {!notif.cancellationRequest || notif.cancellationRequest.status === 'none' || notif.cancellationRequest.status === 'rejected' ? (
                      <button
                        onClick={() => handleRequestCancel(notif)}
                        style={{
                          padding: '8px 16px',
                          background: '#e53935',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                      >
                        🚫 Request Cancel
                      </button>
                    ) : notif.cancellationRequest?.status === 'pending' ? (
                      <div style={{
                        padding: '8px 16px',
                        background: '#fff3e0',
                        color: '#e65100',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        border: '1px solid #ff9800'
                      }}>
                        Cancellation Requested
                      </div>
                    ) : (
                      <div style={{color: '#4CAF50', fontWeight: '500'}}>Accepted</div>
                    )}
                  </div>
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

        {/* Cancelled Schedules Tab */}
        {activeTab === 'cancelled' && userRole === 'supplier' && (
          <div className="notification-list">
            {cancelledNotifications.length === 0 ? (
              <div>No cancelled schedules</div>
            ) : filterByTimeRange(cancelledNotifications).length === 0 ? (
              <div>No cancelled schedules in this time range</div>
            ) : (
              filterByTimeRange(cancelledNotifications).map((notif) => (
                <div key={notif._id} className="notification-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f5f5f5',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  borderLeft: '4px solid #9e9e9e'
                }}>
                  <div style={{flex: 1}}>
                    <h4 style={{marginBottom: '8px'}}>{notif.eventType || notif.title}</h4>
                    {notif.description && (
                      <p style={{color: '#666', marginBottom: '4px', whiteSpace: 'pre-line'}}>{notif.description}</p>
                    )}
                    {notif.location && (
                      <div style={{color: '#888', fontSize: '0.97rem', marginBottom: '4px'}}>Location: {notif.location}</div>
                    )}
                    <div style={{fontSize: '0.9rem', color: '#888'}}>Date: {notif.date}</div>
                    
                    {/* Show cancellation details */}
                    {notif.cancellationRequest && (
                      <div style={{marginTop: '12px', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #9e9e9e'}}>
                        <div style={{fontWeight: '600', color: '#616161', fontSize: '0.85rem', marginBottom: '4px'}}>
                          Cancellation Details
                        </div>
                        <div style={{fontSize: '0.8rem', color: '#666', marginBottom: '2px'}}>
                          <strong>Reason:</strong> {notif.cancellationRequest.reason}
                        </div>
                        <div style={{fontSize: '0.8rem', color: '#666', marginBottom: '2px'}}>
                          <strong>Description:</strong> {notif.cancellationRequest.description}
                        </div>
                        {notif.cancellationRequest.adminNotes && (
                          <div style={{fontSize: '0.8rem', color: '#666', marginTop: '4px', fontStyle: 'italic'}}>
                            <strong>Admin Notes:</strong> {notif.cancellationRequest.adminNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{color: '#9e9e9e', fontWeight: '500'}}>Cancelled</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Cancellation Request Modal */}
        {showCancelModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2147483647,
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
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedScheduleToCancel(null);
                  setCancelForm({ reason: '', description: '' });
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>

              <h2 style={{fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px', color: '#c62828'}}>
                Request Schedule Cancellation
              </h2>
              <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '24px'}}>
                Please provide the reason for cancelling this accepted schedule. The admin will review your request.
              </p>

              {/* Schedule Info */}
              <div style={{
                background: '#f5f5f5',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{fontWeight: '600', fontSize: '1rem', marginBottom: '8px'}}>
                  {selectedScheduleToCancel?.eventType || selectedScheduleToCancel?.title}
                </div>
                <div style={{fontSize: '0.85rem', color: '#666'}}>
                  Date: {selectedScheduleToCancel?.date}
                </div>
                {selectedScheduleToCancel?.location && (
                  <div style={{fontSize: '0.85rem', color: '#666'}}>
                    Location: {selectedScheduleToCancel.location}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div style={{
                background: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{fontWeight: 600, color: '#e65100', marginBottom: '8px'}}>⚠️ Important:</div>
                <ul style={{margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#666'}}>
                  <li>Cancellation must be approved by admin</li>
                  <li>Customer will be notified of your cancellation</li>
                  <li>This may affect your reputation with the customer</li>
                </ul>
              </div>

              {/* Reason Dropdown */}
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555'}}>
                  Reason for Cancellation <span style={{color: '#e53935'}}>*</span>
                </label>
                <select
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Select a reason</option>
                  {scheduleCancellationReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555'}}>
                  Additional Details <span style={{color: '#e53935'}}>*</span>
                </label>
                <textarea
                  value={cancelForm.description}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please explain why you need to cancel this schedule..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                />
              </div>

              <button
                style={{
                  background: cancelForm.reason && cancelForm.description.trim()
                    ? 'linear-gradient(90deg, #e53935 0%, #d32f2f 100%)'
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: cancelForm.reason && cancelForm.description.trim() ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.2s',
                  color: '#fff'
                }}
                disabled={!cancelForm.reason || !cancelForm.description.trim()}
                onClick={handleSubmitCancellation}
              >
                Submit Cancellation Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
