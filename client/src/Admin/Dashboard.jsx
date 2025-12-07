import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Sidebar from './Sidebar';
import { Calendar as RsuiteCalendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  // Push notification state
  const [showNotification, setShowNotification] = useState(true);
  const [notificationList, setNotificationList] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Branch filter for revenue chart (UI only)
  const [branchFilter, setBranchFilter] = useState('all');
  // Most availed products/services
  const [mostAvailedProducts, setMostAvailedProducts] = useState([]);
  // Expand state for tables
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  // Appointment counts
    // For calendar events
    const [calendarEvents, setCalendarEvents] = useState([]);
    const navigate = typeof useNavigate === 'function' ? useNavigate() : null;
  
  // Backup/Restore state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Backup function - exports all databases as JSON
  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      setBackupMessage('Exporting database backup...');
      
      const response = await fetch('/api/backup/export');
      
      if (!response.ok) {
        throw new Error('Failed to export backup');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goldust-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setBackupMessage('✓ Backup exported successfully!');
      setTimeout(() => setBackupMessage(''), 3000);
    } catch (error) {
      console.error('Backup error:', error);
      setBackupMessage('✗ Error exporting backup');
      setTimeout(() => setBackupMessage(''), 3000);
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore function - imports JSON backup
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const confirmed = window.confirm(
      '⚠️ WARNING: This will replace ALL current database data with the backup data.\n\n' +
      'Are you absolutely sure you want to proceed?'
    );
    
    if (!confirmed) {
      event.target.value = '';
      return;
    }
    
    try {
      setRestoreLoading(true);
      setBackupMessage('Restoring database from backup...');
      
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);
      
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to restore backup');
      }
      
      const result = await response.json();
      console.log('Restore result:', result);
      
      setBackupMessage('✓ Database restored successfully! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Restore error:', error);
      setBackupMessage('✗ Error restoring backup: ' + error.message);
      setTimeout(() => setBackupMessage(''), 5000);
    } finally {
      setRestoreLoading(false);
      event.target.value = '';
    }
  };

  // Export function - generates Excel file with all dashboard data
  const handleExport = async () => {
    setExportLoading(true);
    setBackupMessage('');
    
    try {
      // Fetch all booking data
      const [pendingRes, approvedRes, finishedRes] = await Promise.all([
        fetch('/api/bookings/pending'),
        fetch('/api/bookings/approved'),
        fetch('/api/bookings/finished')
      ]);
      
      const [pendingBookingsData, approvedBookingsData, finishedBookingsData] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        finishedRes.json()
      ]);
      
      const allBookings = [...pendingBookingsData, ...approvedBookingsData, ...finishedBookingsData];
      
      // Filter bookings by current filter
      const filteredBookings = allBookings.filter(booking => matchesFilter(booking.date, filter, selectedYear));
      
      // Count filtered bookings by status
      const pendingCount = filteredBookings.filter(b => b.status === 'pending').length;
      const approvedCount = filteredBookings.filter(b => b.status === 'approved').length;
      const finishedCount = filteredBookings.filter(b => b.status === 'finished').length;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Overview Summary
      const overviewData = [
        ['GOLDUST CREATIONS - DASHBOARD OVERVIEW'],
        ['Generated:', new Date().toLocaleString()],
        ['Filter:', filter === 'all' ? `All Months ${selectedYear}` : `${months[filter]} ${selectedYear}`],
        ['Branch:', branchFilter === 'all' ? 'All Branches' : branchFilter],
        [],
        ['BOOKINGS SUMMARY'],
        ['Pending Bookings', pendingCount],
        ['Approved Bookings', approvedCount],
        ['Finished Bookings', finishedCount],
        [],
        ['APPOINTMENTS'],
        ['Upcoming Appointments', upcomingAppointments !== null ? upcomingAppointments : 0],
        ['Finished Appointments', finishedAppointments !== null ? finishedAppointments : 0],
        [],
        ['CUSTOMERS & SUPPLIERS'],
        ['Total Customers', totalCustomers !== null ? totalCustomers : 0],
        ['Total Suppliers', totalSuppliers !== null ? totalSuppliers : 0],
        [],
        ['BOOKINGS BY LOCATION'],
        ['Sta. Fe, Nueva Vizcaya', bookingsByLocation['sta fe nueva vizcaya'] || 0],
        ['La Trinidad, Benguet', bookingsByLocation['la trinidad benguet'] || 0],
        ['Maddela, Quirino', bookingsByLocation['maddela quirino'] || 0],
        [],
        ['REVIEWS'],
        ['Average Rating', reviewSummary.avg.toFixed(1)],
        ['Total Reviews', reviewSummary.total],
        [],
        ['URGENT REMINDERS'],
        ['Due within 3 days', urgentReminders]
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Overview');
      
      // Sheet 2: Revenue Data
      const revenueSheetData = [
        ['MONTHLY REVENUE - ' + selectedYear],
        ['Branch Filter:', branchFilter === 'all' ? 'All Branches' : branchFilter],
        [],
        ['Month', 'Revenue (PHP)']
      ];
      
      if (revenueData && revenueData.length > 0) {
        revenueData.forEach(item => {
          revenueSheetData.push([months[item.month] || item.month, item.value || 0]);
        });
        
        // Add total
        const totalRevenue = revenueData.reduce((sum, item) => sum + (item.value || 0), 0);
        revenueSheetData.push(['', '']);
        revenueSheetData.push(['TOTAL REVENUE', totalRevenue]);
      } else {
        revenueSheetData.push(['No revenue data available', '']);
      }
      
      const ws2 = XLSX.utils.aoa_to_sheet(revenueSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Revenue');
      
      // Sheet 3: Detailed Bookings (Filtered by selected month/year)
      const bookingDetails = [
        ['BOOKING DETAILS - ' + (filter === 'all' ? 'All Months' : months[filter]) + ' ' + selectedYear],
        ['Total Bookings:', filteredBookings.length],
        [],
        ['Booking ID', 'Status', 'Client Name', 'Email', 'Contact', 'Event Type', 'Event Venue', 'Branch Location', 'Date', 'Guest Count', 'Theme', 'Total Price (PHP)', 'Special Request']
      ];
      
      if (filteredBookings.length > 0) {
        filteredBookings.forEach(booking => {
          bookingDetails.push([
            booking._id || 'N/A',
            (booking.status || 'unknown').toUpperCase(),
            booking.name || 'N/A',
            booking.email || 'N/A',
            booking.contact || 'N/A',
            booking.eventType || 'N/A',
            booking.eventVenue || 'N/A',
            booking.branchLocation || 'N/A',
            booking.date ? new Date(booking.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A',
            booking.guestCount || 'N/A',
            booking.theme || 'N/A',
            booking.totalPrice || 0,
            booking.specialRequest || 'None'
          ]);
        });
        
        // Add summary at the bottom
        bookingDetails.push([]);
        bookingDetails.push(['SUMMARY']);
        bookingDetails.push(['Total Revenue (PHP):', filteredBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)]);
        bookingDetails.push(['Average Guest Count:', Math.round(filteredBookings.reduce((sum, b) => sum + (Number(b.guestCount) || 0), 0) / filteredBookings.length)]);
      } else {
        bookingDetails.push(['No bookings found for the selected filter', '', '', '', '', '', '', '', '', '', '', '', '']);
      }
      
      const ws3 = XLSX.utils.aoa_to_sheet(bookingDetails);
      XLSX.utils.book_append_sheet(wb, ws3, 'Bookings');
      
      // Sheet 4: Active Customers
      const customerData = [
        ['CUSTOMERS WHO BOOKED'],
        ['Name', 'Email', 'Times Booked']
      ];
      
      activeCustomers.forEach(customer => {
        customerData.push([
          customer.customerName,
          customer.customerEmail,
          customer.count
        ]);
      });
      
      const ws4 = XLSX.utils.aoa_to_sheet(customerData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Customers');
      
      // Sheet 5: Active Suppliers
      const supplierData = [
        ['MOST ACTIVE SUPPLIERS'],
        ['Company Name', 'Phone', 'Email', 'Times Booked']
      ];
      
      activeSuppliers.forEach(supplier => {
        supplierData.push([
          supplier.supplierName,
          supplier.supplierPhone || '',
          supplier.supplierEmail,
          supplier.count
        ]);
      });
      
      const ws5 = XLSX.utils.aoa_to_sheet(supplierData);
      XLSX.utils.book_append_sheet(wb, ws5, 'Suppliers');
      
      // Sheet 6: Most Availed Products/Services
      const productsData = [
        ['MOST AVAILED PRODUCTS/SERVICES'],
        ['Product/Service Name', 'Times Availed']
      ];
      
      mostAvailedProducts.forEach(product => {
        productsData.push([
          product.productName,
          product.count
        ]);
      });
      
      const ws6 = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, ws6, 'Products & Services');
      
      // Generate filename with date and filter
      const filterText = filter === 'all' ? 'All_Months' : months[filter];
      const branchText = branchFilter === 'all' ? 'All_Branches' : branchFilter;
      const filename = `Goldust_Dashboard_${filterText}_${selectedYear}_${branchText}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, filename);
      
      setBackupMessage('✓ Dashboard exported successfully!');
      setTimeout(() => setBackupMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setBackupMessage('✗ Export failed: ' + error.message);
      setTimeout(() => setBackupMessage(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

    // Fetch calendar events (same logic as Calendars.jsx)
    useEffect(() => {
      async function fetchEventsAndBookings() {
        try {
          const [schedulesRes, acceptedSchedulesRes, pendingRes, approvedRes, finishedRes, appointmentsRes, notificationsRes] = await Promise.all([
            fetch('/api/schedules'),
            fetch('/api/schedules/status/accepted'),
            fetch('/api/bookings/pending'),
            fetch('/api/bookings/approved'),
            fetch('/api/bookings/finished'),
            fetch('/api/appointments'),
            fetch('/api/notifications'),
          ]);
          const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
          const acceptedSchedules = acceptedSchedulesRes.ok ? await acceptedSchedulesRes.json() : [];
          const pending = pendingRes.ok ? await pendingRes.json() : [];
          const approved = approvedRes.ok ? await approvedRes.json() : [];
          const finished = finishedRes.ok ? await finishedRes.json() : [];
          const notifications = notificationsRes.ok ? await notificationsRes.json() : [];
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
                location: b.branchLocation || b.eventVenue || '',
                description: b.specialRequest || b.details || '',
                status: b.status || '',
              };
            });
          const appointmentEvents = appointments
            .filter(a => a.status === 'upcoming') // Only show upcoming appointments on calendar
            .map(a => {
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
                location: a.branchLocation || a.location || '', // Use branchLocation for color coding
                description: a.description || '',
                status: a.status || '',
              };
            });
          
          // Map accepted schedules to ensure branchLocation is used for location field (for color coding)
          const acceptedScheduleEvents = (Array.isArray(acceptedSchedules) ? acceptedSchedules : []).map(s => ({
            ...s,
            location: s.branchLocation || s.location || ''
          }));

          // Map regular schedules to ensure branchLocation is used for location field (for color coding)
          const scheduleEvents = (Array.isArray(schedules) ? schedules : []).map(s => ({
            ...s,
            location: s.branchLocation || s.location || ''
          }));

          // Map notifications to ensure location field is present
          const notificationEvents = (Array.isArray(notifications) ? notifications : []).map(n => ({
            ...n,
            location: n.location || ''
          }));
          
          const allEvents = [
            ...scheduleEvents,
            ...acceptedScheduleEvents,
            ...bookingEvents,
            ...appointmentEvents,
            ...notificationEvents
          ];
          setCalendarEvents(allEvents);
        } catch (err) {
          setCalendarEvents([]);
        }
      }
      fetchEventsAndBookings();
    }, []);
    // Helper to get color based on branch location
    function getLocationColor(location) {
      if (!location) return '#ffe082'; // default yellow
      const loc = location.toLowerCase();
      
      // Sta Fe, Nueva Vizcaya - Red
      if (loc.includes('sta') && loc.includes('fe') && loc.includes('nueva vizcaya')) {
        return 'rgba(255, 89, 89, 1)'; // light red
      }
      // La Trinidad, Benguet - Green
      if (loc.includes('la trinidad') && loc.includes('benguet')) {
        return 'rgba(57, 247, 126, 1)'; // light green
      }
      // Maddela, Quirino - Blue
      if (loc.includes('maddela') && loc.includes('quirino')) {
        return 'rgba(48, 127, 255, 0.34)'; // light blue
      }
      
      return '#ffe082'; // default yellow
    }

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
      return (
        <div
          style={{ marginTop: 4, cursor: 'pointer', minHeight: 40 }}
          onClick={() => navigate && navigate('/admin/calendars')}
          title="Click to view full calendar"
        >
          {dayEvents.length === 0 ? null : (
            <>
              {dayEvents.slice(0, maxToShow).map(ev => {
                const bgColor = getLocationColor(ev.location);
                return (
                  <div key={ev._id || ev.id} style={{ background: bgColor, color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2 }}>
                    {ev.title}
                  </div>
                );
              })}
              {dayEvents.length > maxToShow && (
                <div
                  key="more"
                  style={{ background: '#ffe082', color: '#111', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2, textAlign: 'center', fontWeight: 700 }}
                  title="View more events"
                >more</div>
              )}
            </>
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
    if (filter === 'all') return `| all months ${selectedYear}`;
    if (typeof filter === 'number' && filter >= 0 && filter < 12) return `| ${months[filter]} ${selectedYear}`;
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
    'La Trinidad, Benguet': 0,
    'Sta. Fe, Nueva Vizcaya': 0,
    'Maddela, Quirino': 0,
  });
    // Helper to standardize location names from booking details
    function getStandardLocation(rawLocation) {
      if (!rawLocation) return '';
      const loc = rawLocation.toLowerCase();
      if (loc.includes('la trinidad') || loc.includes('latrinidad')) return 'La Trinidad, Benguet';
      if (loc.includes('sta. fe') || loc.includes('stafe') || loc.includes('santa fe')) return 'Sta. Fe, Nueva Vizcaya';
      if (loc.includes('maddela') || loc.includes('quirino')) return 'Maddela, Quirino';
      return rawLocation;
    }
  // Default filter is current month (0-based) and current year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState(new Date().getMonth());
  const [revenueData, setRevenueData] = useState([]);
  const [urgentReminders, setUrgentReminders] = useState(0);

  // Helper to get start date based on filter
  function getStartDate(filter) {
    if (filter === 'all') {
      return new Date(selectedYear, 0, 1);
    }
    if (typeof filter === 'number' && filter >= 0 && filter < 12) {
      return new Date(selectedYear, filter, 1);
    }
    return new Date(selectedYear, new Date().getMonth(), 1);
  }

  // Helper to check if a date matches the selected year and month filter
  function matchesFilter(dateString, filter, selectedYear) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    
    // Check year first
    if (dateYear !== selectedYear) return false;
    
    // If filter is 'all', any date in the selected year matches
    if (filter === 'all') return true;
    
    // Otherwise, check if the month matches
    if (typeof filter === 'number' && filter >= 0 && filter < 12) {
      return dateMonth === filter;
    }
    
    return false;
  }

  // Separate useEffect for revenue data - refetch when year or branch changes
  useEffect(() => {
    // Fetch revenue data (all months for the selected year - chart shows annual data)
    console.log('Fetching revenue data for year:', selectedYear, 'branch:', branchFilter);
    fetch(`/api/revenue?filter=all&year=${selectedYear}&branch=${branchFilter}`, {
      cache: 'no-store'
    })
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          console.log('Revenue data received for year', selectedYear, 'branch', branchFilter, ':', data);
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
  }, [selectedYear, branchFilter]); // Depends on selectedYear and branchFilter

  // Fetch bookings and generate notifications for upcoming events
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [pendingRes, approvedRes, finishedRes] = await Promise.all([
          fetch('/api/bookings/pending'),
          fetch('/api/bookings/approved'),
          fetch('/api/bookings/finished')
        ]);

        const [pending, approved, finished] = await Promise.all([
          pendingRes.json(),
          approvedRes.json(),
          finishedRes.json()
        ]);

        const allBookings = [...pending, ...approved, ...finished];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const notifications = [];

        allBookings.forEach(booking => {
          if (!booking.date) return;

          const bookingDate = new Date(booking.date);
          bookingDate.setHours(0, 0, 0, 0);

          const daysUntil = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));

          // Create notifications for 7 days, 3 days, and 1 day before
          if (daysUntil === 7 || daysUntil === 3 || daysUntil === 1) {
            const suppliersList = booking.selectedProducts && Array.isArray(booking.selectedProducts)
              ? booking.selectedProducts.map(p => p.supplierName || 'Unknown Supplier').join(', ')
              : 'No suppliers assigned';

            let timeText = '';
            if (daysUntil === 7) timeText = '1 week before';
            else if (daysUntil === 3) timeText = '3 days before';
            else if (daysUntil === 1) timeText = '1 day before';

            notifications.push({
              id: `${booking._id}-${daysUntil}`,
              title: `Upcoming ${booking.eventType || 'Booking'} - ${timeText}`,
              message: `Booker: ${booking.name || 'Unknown'} | Branch: ${booking.branchLocation || 'Not specified'} | Suppliers: ${suppliersList}`,
              time: `${daysUntil} day${daysUntil > 1 ? 's' : ''} until event`,
              read: false,
              bookingDate: booking.date,
              daysUntil: daysUntil,
              // Full booking details
              bookingDetails: {
                eventType: booking.eventType || 'N/A',
                bookerName: booking.name || 'N/A',
                bookerEmail: booking.email || 'N/A',
                bookerContact: booking.contact || 'N/A',
                branchLocation: booking.branchLocation || 'N/A',
                eventVenue: booking.eventVenue || 'N/A',
                eventDate: booking.date,
                guestCount: booking.guestCount || 'N/A',
                theme: booking.theme || 'N/A',
                totalPrice: booking.totalPrice || 0,
                status: booking.status || 'N/A',
                specialRequest: booking.specialRequest || 'None',
                suppliers: booking.selectedProducts && Array.isArray(booking.selectedProducts)
                  ? booking.selectedProducts
                  : []
              }
            });
          }
        });

        // Sort by days until event (closest first)
        notifications.sort((a, b) => a.daysUntil - b.daysUntil);

        setNotificationList(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotificationList([]);
      }
    };

    fetchNotifications();
  }, []);

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
            const matchesAppointmentBranch = (appointment) => {
              if (branchFilter === 'all') return true;
              const branch = (appointment.branchLocation || '').toLowerCase();
              if (branchFilter === 'santafe') {
                return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
              }
              if (branchFilter === 'latrinidad') {
                return branch.includes('la trinidad') && branch.includes('benguet');
              }
              if (branchFilter === 'maddela') {
                return branch.includes('maddela') && branch.includes('quirino');
              }
              return true;
            };
            
            const upcoming = data.filter(a => {
              return matchesFilter(a.date, filter, selectedYear) && a.status === 'upcoming' && matchesAppointmentBranch(a);
            }).length;
            const finished = data.filter(a => {
              return matchesFilter(a.date, filter, selectedYear) && a.status === 'finished' && matchesAppointmentBranch(a);
            }).length;
            setUpcomingAppointments(upcoming);
            setFinishedAppointments(finished);
          })
          .catch(() => {
            setUpcomingAppointments(0);
            setFinishedAppointments(0);
          });
    // Fetch urgent reminders (all events due today, tomorrow, or in 2 days: schedules, accepted schedules, bookings, appointments)
    Promise.all([
      fetch('/api/schedules'),
      fetch('/api/schedules/status/accepted'),
      fetch('/api/bookings/pending'),
      fetch('/api/bookings/approved'),
      fetch('/api/bookings/finished'),
      fetch('/api/appointments')
    ])
      .then(([schedulesRes, acceptedSchedulesRes, pendingRes, approvedRes, finishedRes, appointmentsRes]) => 
        Promise.all([schedulesRes.json(), acceptedSchedulesRes.json(), pendingRes.json(), approvedRes.json(), finishedRes.json(), appointmentsRes.json()])
      )
      .then(([schedules, acceptedSchedules, pendingBookings, approvedBookings, finishedBookings, appointments]) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        
        let count = 0;
        
        // Helper to check if date is urgent (today, tomorrow, or in 2 days)
        const isUrgent = (dateStr) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime() || d.getTime() === dayAfterTomorrow.getTime();
        };
        
        // Helper to check branch for schedules
        const matchesScheduleBranch = (schedule) => {
          if (branchFilter === 'all') return true;
          const branch = (schedule.branchLocation || '').toLowerCase();
          if (branchFilter === 'santafe') {
            return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
          }
          if (branchFilter === 'latrinidad') {
            return branch.includes('la trinidad') && branch.includes('benguet');
          }
          if (branchFilter === 'maddela') {
            return branch.includes('maddela') && branch.includes('quirino');
          }
          return true;
        };
        
        // Helper to check branch for bookings
        const matchesBookingBranch = (booking) => {
          if (branchFilter === 'all') return true;
          const branch = (booking.branchLocation || '').toLowerCase();
          if (branchFilter === 'santafe') {
            return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
          }
          if (branchFilter === 'latrinidad') {
            return branch.includes('la trinidad') && branch.includes('benguet');
          }
          if (branchFilter === 'maddela') {
            return branch.includes('maddela') && branch.includes('quirino');
          }
          return true;
        };
        
        // Helper to check branch for appointments
        const matchesAppointmentBranch = (appointment) => {
          if (branchFilter === 'all') return true;
          const branch = (appointment.branchLocation || '').toLowerCase();
          if (branchFilter === 'santafe') {
            return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
          }
          if (branchFilter === 'latrinidad') {
            return branch.includes('la trinidad') && branch.includes('benguet');
          }
          if (branchFilter === 'maddela') {
            return branch.includes('maddela') && branch.includes('quirino');
          }
          return true;
        };
        
        // Count urgent schedules (both regular and accepted)
        [...schedules, ...acceptedSchedules].forEach(s => {
          if (isUrgent(s.date) && matchesScheduleBranch(s)) count++;
        });
        
        // Count urgent bookings (all statuses: pending, approved, finished)
        [...pendingBookings, ...approvedBookings, ...finishedBookings].forEach(b => {
          if (isUrgent(b.date) && matchesBookingBranch(b)) count++;
        });
        
        // Count urgent appointments
        appointments.forEach(a => {
          if (isUrgent(a.date) && matchesAppointmentBranch(a)) count++;
        });
        
        setUrgentReminders(count);
      })
      .catch(() => setUrgentReminders(0));
    // Helper to match branch filter
    const matchesBranchFilter = (booking) => {
      if (branchFilter === 'all') return true;
      const branch = (booking.branchLocation || '').toLowerCase();
      if (branchFilter === 'santafe') {
        return branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya');
      }
      if (branchFilter === 'latrinidad') {
        return branch.includes('la trinidad') && branch.includes('benguet');
      }
      if (branchFilter === 'maddela') {
        return branch.includes('maddela') && branch.includes('quirino');
      }
      return true;
    };

    // Fetch pending events
    fetch('/api/bookings/pending')
      .then(res => res.json())
      .then(data => {
        const count = data.filter(ev => 
          matchesFilter(ev.date || ev.createdAt, filter, selectedYear) && 
          matchesBranchFilter(ev)
        ).length;
        setPendingEvents(count);
      })
      .catch(() => setPendingEvents(0));

    // Fetch approved bookings
    fetch('/api/bookings/approved')
      .then(res => res.json())
      .then(data => {
        const count = data.filter(ev => 
          matchesFilter(ev.date || ev.createdAt, filter, selectedYear) && 
          matchesBranchFilter(ev)
        ).length;
        setApprovedBookings(count);
      })
      .catch(() => setApprovedBookings(0));

    // Fetch finished bookings
    fetch('/api/bookings/finished')
      .then(res => res.json())
      .then(data => {
        const count = data.filter(ev => 
          matchesFilter(ev.date || ev.createdAt, filter, selectedYear) && 
          matchesBranchFilter(ev)
        ).length;
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
        
        // Only include bookings created within the filter month and matching branch
        const filteredBookings = allBookings.filter(b => {
          // Bookings have userId, name, email directly (not nested in customer object)
          if (!b.userId && !b.email) return false; // Need at least userId or email
          return matchesFilter(b.createdAt, filter, selectedYear) && matchesBranchFilter(b);
        });
        // Count bookings per customer
        const customerCounts = {};
        filteredBookings.forEach(b => {
          // Use userId or email as unique identifier
          const customerId = b.userId || b.email;
          const customerName = b.name || b.email || 'Unknown';
          const customerEmail = b.email || '';
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

    // Fetch most active suppliers based on accepted schedules
    fetch(`/api/suppliers/most-active?filter=${filter}&year=${selectedYear}&branch=${branchFilter}`)
      .then(res => res.json())
      .then(data => {
        setActiveSuppliers(data);
        setTotalSuppliers(data.length);
      })
      .catch(() => {
        setTotalSuppliers(0);
        setActiveSuppliers([]);
      });

    // Fetch bookings by branch location (which branch they selected in the booking form)
    Promise.all([
      fetch('/api/bookings/pending'),
      fetch('/api/bookings/approved'),
      fetch('/api/bookings/finished')
    ])
      .then(([pendingRes, approvedRes, finishedRes]) => Promise.all([pendingRes.json(), approvedRes.json(), finishedRes.json()]))
      .then(([pending, approved, finished]) => {
        const allBookings = [...pending, ...approved, ...finished];
        
        const branchCounts = {
          'sta fe nueva vizcaya': 0,
          'la trinidad benguet': 0,
          'maddela quirino': 0,
        };

        allBookings.forEach(booking => {
          // Check if booking matches the selected year and month filter AND branch filter
          if (!matchesFilter(booking.date || booking.createdAt, filter, selectedYear)) return;
          if (!matchesBranchFilter(booking)) return;
          
          const branch = (booking.branchLocation || '').toLowerCase().trim();
          
          // Match Santa Fe / Sta. Fe, Nueva Vizcaya
          if (branch.includes('sta') && branch.includes('fe') && branch.includes('nueva vizcaya')) {
            branchCounts['sta fe nueva vizcaya']++;
          }
          // Match La Trinidad, Benguet
          else if (branch.includes('la trinidad') && branch.includes('benguet')) {
            branchCounts['la trinidad benguet']++;
          }
          // Match Maddela, Quirino
          else if (branch.includes('maddela') && branch.includes('quirino')) {
            branchCounts['maddela quirino']++;
          }
        });

        setBookingsByLocation(branchCounts);
      })
      .catch(() => setBookingsByLocation({
        'sta fe nueva vizcaya': 0,
        'la trinidad benguet': 0,
        'maddela quirino': 0,
      }));

    // Fetch most availed products/services
    fetch(`/api/bookings/most-availed?filter=${filter}&year=${selectedYear}&branch=${branchFilter}`)
      .then(res => res.json())
      .then(data => {
        setMostAvailedProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setMostAvailedProducts([]));
  }, [filter, selectedYear, branchFilter]);

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        {/* Push Notification Popup */}
        {showNotification && (
          <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 380,
            maxHeight: 500,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Notifications</h3>
                {notificationList.filter(n => !n.read).length > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {notificationList.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotification(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Notification List */}
            <div style={{
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '8px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            className="notification-list-scroll">
              {notificationList.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>No upcoming booking reminders</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Reminders appear 7 days, 3 days, and 1 day before bookings</p>
                </div>
              ) : (
                notificationList.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: notification.read ? '#fff' : '#f8f9ff',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => {
                    setSelectedNotification(notification);
                    setShowNotificationModal(true);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f7ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.read ? '#fff' : '#f8f9ff'}
                >
                  {!notification.read && (
                    <div style={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 8,
                      height: 8,
                      background: '#3b82f6',
                      borderRadius: '50%'
                    }} />
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    paddingLeft: notification.read ? 0 : 12
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '20px' }}>📬</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontWeight: 500
                      }}>
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notification Details Modal */}
        {showNotificationModal && selectedNotification && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20
          }}
          onClick={() => setShowNotificationModal(false)}
          >
            <div style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px 28px',
                color: '#fff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>
                  {selectedNotification.title}
                </h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                  {selectedNotification.time}
                </p>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '28px' }}>
                {/* Booking Information */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: '#1f2937',
                    borderBottom: '2px solid #667eea',
                    paddingBottom: 8
                  }}>
                    📋 Booking Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Event Type
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.eventType}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Status
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500, textTransform: 'capitalize' }}>
                        {selectedNotification.bookingDetails.status}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Event Date
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {new Date(selectedNotification.bookingDetails.eventDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Guest Count
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.guestCount} guests
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booker Information */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: '#1f2937',
                    borderBottom: '2px solid #667eea',
                    paddingBottom: 8
                  }}>
                    👤 Booker Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Name
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.bookerName}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Contact
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.bookerContact}
                      </p>
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Email
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.bookerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & Venue */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: '#1f2937',
                    borderBottom: '2px solid #667eea',
                    paddingBottom: 8
                  }}>
                    📍 Location & Venue
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Branch Location
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.branchLocation}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Event Venue
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.eventVenue}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Theme
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedNotification.bookingDetails.theme}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Total Price
                      </label>
                      <p style={{ margin: 0, fontSize: '15px', color: '#10b981', fontWeight: 700 }}>
                        ₱{selectedNotification.bookingDetails.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suppliers List */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: '#1f2937',
                    borderBottom: '2px solid #667eea',
                    paddingBottom: 8
                  }}>
                    🏪 Assigned Suppliers
                  </h3>
                  
                  {selectedNotification.bookingDetails.suppliers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedNotification.bookingDetails.suppliers.map((supplier, index) => (
                        <div key={index} style={{
                          padding: '12px 16px',
                          background: '#f9fafb',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                                {supplier.supplierName || 'Unknown Supplier'}
                              </p>
                              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                                {supplier.productName || 'Product/Service'}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#667eea' }}>
                                ₱{(supplier.price || 0).toLocaleString()}
                              </p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                                Qty: {supplier.quantity || 1}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px', color: '#6b7280', fontStyle: 'italic' }}>
                      No suppliers assigned yet
                    </p>
                  )}
                </div>

                {/* Special Requests */}
                {selectedNotification.bookingDetails.specialRequest && selectedNotification.bookingDetails.specialRequest !== 'None' && (
                  <div>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      fontSize: '18px', 
                      fontWeight: 700,
                      color: '#1f2937',
                      borderBottom: '2px solid #667eea',
                      paddingBottom: 8
                    }}>
                      📝 Special Requests
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '15px', 
                      color: '#1f2937', 
                      lineHeight: 1.6,
                      padding: '12px 16px',
                      background: '#fef3c7',
                      borderRadius: 8,
                      border: '1px solid #fbbf24'
                    }}>
                      {selectedNotification.bookingDetails.specialRequest}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '20px 28px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12
              }}>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Overview</h2>
            {backupMessage && (
              <span style={{ 
                fontSize: '0.9rem', 
                color: backupMessage.includes('✓') ? '#10b981' : '#ef4444',
                fontWeight: 500
              }}>
                {backupMessage}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Export to Excel button */}
            <button
              onClick={handleExport}
              disabled={exportLoading || backupLoading || restoreLoading}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: exportLoading || backupLoading || restoreLoading ? 'not-allowed' : 'pointer',
                opacity: exportLoading || backupLoading || restoreLoading ? 0.6 : 1,
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!exportLoading && !backupLoading && !restoreLoading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {exportLoading ? '⏳ Exporting...' : '📊 Export to Excel'}
            </button>
            {/* Backup/Restore buttons */}
            <button
              onClick={handleBackup}
              disabled={backupLoading || restoreLoading || exportLoading}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: backupLoading || restoreLoading ? 'not-allowed' : 'pointer',
                opacity: backupLoading || restoreLoading ? 0.6 : 1,
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!backupLoading && !restoreLoading && !exportLoading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {backupLoading ? '⏳ Exporting...' : '💾 Backup Database'}
            </button>
            <label
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'linear-gradient(90deg, #f59e42 0%, #f43f5e 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: backupLoading || restoreLoading || exportLoading ? 'not-allowed' : 'pointer',
                opacity: backupLoading || restoreLoading || exportLoading ? 0.6 : 1,
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                if (!backupLoading && !restoreLoading && !exportLoading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {restoreLoading ? '⏳ Restoring...' : '📥 Restore Database'}
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={backupLoading || restoreLoading || exportLoading}
                style={{ display: 'none' }}
              />
            </label>
            <label style={{ fontWeight: 500 }}>Show:</label>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', color: '#222', background: '#fff', outline: 'none', boxShadow: 'none' }}
            >
              <option value="all">All Branches</option>
              <option value="santafe">Sta. Fe, Nueva Vizcaya</option>
              <option value="latrinidad">La Trinidad, Benguet</option>
              <option value="maddela">Maddela, Quirino</option>
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', color: '#222', background: '#fff', outline: 'none', boxShadow: 'none' }}
            >
              {(() => {
                const startYear = 2025; // Fixed starting year
                const currentYear = new Date().getFullYear();
                const yearsToShow = Math.max(4, (currentYear - startYear) + 4); // At least 4 years, or more as time passes
                return Array.from({ length: yearsToShow }, (_, i) => startYear + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ));
              })()}
            </select>
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
            <div className="admin-dashboard-card-title" style={{ color: '#fff', fontWeight: 700 }}>Urgent Reminders <span style={{ color: '#fff', fontWeight: 400 }}>| due within 3 days</span></div>
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
              <div className="admin-dashboard-card-value" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#ef4444', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{bookingsByLocation['sta fe nueva vizcaya'] !== null ? bookingsByLocation['sta fe nueva vizcaya'] : '-'}</div>
            </div>
            <div className="admin-dashboard-card" style={{ height: 200, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div className="admin-dashboard-card-title">La Trinidad, Benguet <span style={{ color: '#888', fontWeight: 400 }}>{getFilterLabel(filter)}</span></div>
              <div className="admin-dashboard-card-value" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#22c55e', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{bookingsByLocation['la trinidad benguet'] !== null ? bookingsByLocation['la trinidad benguet'] : '-'}</div>
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
                <th style={{ textAlign: 'right', padding: '8px' }}>Times Booked</th>
              </tr>
            </thead>
            <tbody>
              {activeCustomers.length > 0 ? (
                (showAllCustomers ? activeCustomers : activeCustomers.slice(0, 5)).map(c => (
                  <tr key={c.customerId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{c.customerName}</td>
                    <td style={{ padding: '8px' }}>{c.customerEmail}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{c.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ color: '#888', textAlign: 'center', padding: '12px' }}>No customers found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          {activeCustomers.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                onClick={() => setShowAllCustomers(v => !v)}
              >
                {showAllCustomers ? 'See less' : 'See more'}
              </button>
            </div>
          )}
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
                <th style={{ textAlign: 'right', padding: '8px' }}>Times Booked</th>
              </tr>
            </thead>
            <tbody>
              {activeSuppliers.length > 0 ? (
                (showAllSuppliers ? activeSuppliers : activeSuppliers.slice(0, 5)).map(s => (
                  <tr key={s.supplierId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{s.supplierName}</td>
                    <td style={{ padding: '8px' }}>{s.supplierPhone || '-'}</td>
                    <td style={{ padding: '8px' }}>{s.supplierEmail}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{s.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: '#888', textAlign: 'center', padding: '12px' }}>No suppliers booked for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          {activeSuppliers.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                onClick={() => setShowAllSuppliers(v => !v)}
              >
                {showAllSuppliers ? 'See less' : 'See more'}
              </button>
            </div>
          )}
        </div>

        {/* Most Availed Products/Services (filtered) - table format */}
        <div className="admin-dashboard-list-container" style={{ marginBottom: 18, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: 16 }}>
          <div className="admin-dashboard-card-title" style={{ color: '#222', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
            Most Availed Products/Services
            <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, opacity: 0.8 }}>{getFilterLabel(filter)}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Product/Service Name</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Times Availed</th>
              </tr>
            </thead>
            <tbody>
              {mostAvailedProducts.length > 0 ? (
                mostAvailedProducts.slice(0, 10).map(p => (
                  <tr key={p.productId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{p.productName}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ color: '#888', textAlign: 'center', padding: '12px' }}>No products/services availed for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        

        <div className="admin-dashboard-revenue-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="admin-dashboard-card-title">Annual Revenue Chart <span style={{ color: '#888', fontWeight: 400 }}>| {selectedYear}</span></div>
          </div>
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
            <div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
