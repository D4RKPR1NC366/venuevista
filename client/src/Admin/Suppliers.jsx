
import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Sidebar from './Sidebar';
import './suppliers.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function Suppliers() {
  // Notification dialog state
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifySupplierId, setNotifySupplierId] = useState(null);
  const [notifyForm, setNotifyForm] = useState({
    eventType: '',
    description: '',
    date: '',
    location: '',
    time: '',
  });
  const [notifyLoading, setNotifyLoading] = useState(false);
    // Handle notify button click
    const handleOpenNotify = (supplierId) => {
      setNotifySupplierId(supplierId);
      setNotifyForm({ eventType: '', description: '', date: '', location: '', time: '' });
      setNotifyOpen(true);
    };

    const handleCloseNotify = () => {
      setNotifyOpen(false);
      setNotifySupplierId(null);
      setNotifyForm({ eventType: '', description: '', date: '', location: '', time: '' });
      setNotifyLoading(false);
    };

    // Handle notify form submit
    const handleNotifySubmit = async (e) => {
      e.preventDefault();
      setNotifyLoading(true);
      try {
        const res = await fetch(`/api/admin/suppliers/${notifySupplierId}/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifyForm),
        });
        if (!res.ok) throw new Error('Failed to send notification');
        alert('Notification sent to supplier!');
        handleCloseNotify();
      } catch (err) {
        alert('Error sending notification: ' + err.message);
        setNotifyLoading(false);
      }
    };
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [approvedSuppliers, setApprovedSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [availableEventTypes, setAvailableEventTypes] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        fetch('/api/admin/suppliers/pending'),
        fetch('/api/admin/suppliers/approved')
      ]);
      
      if (!pendingRes.ok || !approvedRes.ok) throw new Error('Failed to fetch suppliers');
      
      const pending = await pendingRes.json();
      const approved = await approvedRes.json();
      
      setPendingSuppliers(pending);
      setApprovedSuppliers(approved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // Fetch available event types
    fetch('/api/event-types')
      .then(res => res.json())
      .then(data => setAvailableEventTypes(data))
      .catch(err => console.error('Failed to fetch event types:', err));
  }, []);

  const handleApprove = async (id) => {
    try {
      const adminEmail = localStorage.getItem('userEmail') || 'admin';
      const res = await fetch(`/api/admin/suppliers/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail })
      });
      
      if (!res.ok) throw new Error('Failed to approve supplier');
      
      alert('Supplier approved successfully!');
      fetchSuppliers();
    } catch (err) {
      alert('Error approving supplier: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject and remove this supplier?')) return;
    
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/reject`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to reject supplier');
      
      alert('Supplier rejected and removed successfully!');
      fetchSuppliers();
    } catch (err) {
      alert('Error rejecting supplier: ' + err.message);
    }
  };

  // Filter suppliers by search and event type
  const currentSuppliers = activeTab === 0 ? pendingSuppliers : approvedSuppliers;
  const filteredSuppliers = currentSuppliers.filter(supplier => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (
      (supplier.companyName || '').toLowerCase().includes(q) ||
      (supplier.firstName || '').toLowerCase().includes(q) ||
      (supplier.middleName || '').toLowerCase().includes(q) ||
      (supplier.lastName || '').toLowerCase().includes(q) ||
      (supplier.email || '').toLowerCase().includes(q)
    );
    
    const matchesEventType = !selectedEventType || 
      (supplier.eventTypes && supplier.eventTypes.some(et => 
        (typeof et === 'string' ? et : et._id) === selectedEventType
      ));
    
    return matchesSearch && matchesEventType;
  });

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-suppliers-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Supplier Management</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormControl size="small" sx={{ minWidth: 200, background: '#fff' }}>
                <InputLabel>Filter by Event Type</InputLabel>
                <Select
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e.target.value)}
                  label="Filter by Event Type"
                >
                  <MenuItem value="">All Event Types</MenuItem>
                  {availableEventTypes.map((eventType) => (
                    <MenuItem key={eventType._id} value={eventType._id}>
                      {eventType.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <input
                type="text"
                placeholder="Search company or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  minWidth: 220,
                  background: '#fff',
                  color: '#222',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label={`Pending Approval (${pendingSuppliers.length})`} />
              <Tab label={`Approved (${approvedSuppliers.length})`} />
            </Tabs>
          </Box>

          {loading ? (
            <p>Loading suppliers...</p>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Event Types</TableCell>
                    {activeTab === 1 && <TableCell>Availability</TableCell>}
                    {activeTab === 0 && <TableCell>Actions</TableCell>}
                    {activeTab === 1 && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === 0 ? 5 : 5} align="center" style={{ color: 'red' }}>
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier._id}>
                        <TableCell>{supplier.companyName || 'N/A'}</TableCell>
                        <TableCell>{`${supplier.firstName} ${supplier.middleName || ''} ${supplier.lastName}`.trim()}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>
                          {supplier.eventTypes && supplier.eventTypes.length > 0 ? (
                            supplier.eventTypes.map((et, idx) => {
                              const eventTypeName = typeof et === 'object' && et.name ? et.name : 
                                availableEventTypes.find(aet => aet._id === et)?.name || 'Unknown';
                              return (
                                <span key={idx} style={{ 
                                  display: 'inline-block', 
                                  background: '#e6b800', 
                                  color: '#000', 
                                  padding: '2px 8px', 
                                  borderRadius: 4, 
                                  fontSize: '0.85rem',
                                  marginRight: 4,
                                  marginBottom: 4
                                }}>
                                  {eventTypeName}
                                </span>
                              );
                            })
                          ) : 'N/A'}
                        </TableCell>
                        {activeTab === 0 && (
                          <TableCell>
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small"
                              onClick={() => handleApprove(supplier._id)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="contained" 
                              color="error" 
                              size="small"
                              onClick={() => handleReject(supplier._id)}
                              sx={{ mr: 1 }}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        )}
                              {/* Notify Supplier Dialog */}
                              <Dialog open={notifyOpen} onClose={handleCloseNotify} maxWidth="xs" fullWidth>
                                <DialogTitle>Notify Supplier for Event</DialogTitle>
                                <form onSubmit={handleNotifySubmit}>
                                  <DialogContent dividers>
                                    <TextField
                                      label="Event Type"
                                      value={notifyForm.eventType}
                                      onChange={e => setNotifyForm(f => ({ ...f, eventType: e.target.value }))}
                                      fullWidth
                                      required
                                      margin="normal"
                                    />
                                    <TextField
                                      label="Description"
                                      value={notifyForm.description}
                                      onChange={e => setNotifyForm(f => ({ ...f, description: e.target.value }))}
                                      fullWidth
                                      required
                                      margin="normal"
                                      multiline
                                      minRows={2}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      <DatePicker
                                        label="Date"
                                        value={notifyForm.date ? dayjs(notifyForm.date) : null}
                                        onChange={newValue => {
                                          setNotifyForm(f => ({ ...f, date: newValue ? newValue.format('YYYY-MM-DD') : '' }));
                                        }}
                                        renderInput={(params) => <TextField {...params} fullWidth required margin="normal" />}
                                        sx={{ width: '100%' }}
                                      />
                                    </LocalizationProvider>
                                    <TextField
                                      label="Time"
                                      type="time"
                                      value={notifyForm.time}
                                      onChange={e => setNotifyForm(f => ({ ...f, time: e.target.value }))}
                                      fullWidth
                                      required
                                      margin="normal"
                                      InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                      label="Location"
                                      value={notifyForm.location}
                                      onChange={e => setNotifyForm(f => ({ ...f, location: e.target.value }))}
                                      fullWidth
                                      required
                                      margin="normal"
                                    />
                                  </DialogContent>
                                  <DialogActions>
                                    <Button onClick={handleCloseNotify} color="secondary">Cancel</Button>
                                    <Button type="submit" variant="contained" color="primary" disabled={notifyLoading}>
                                      {notifyLoading ? 'Sending...' : 'Send Notification'}
                                    </Button>
                                  </DialogActions>
                                </form>
                              </Dialog>
                        {activeTab === 1 && (
                          <>
                            <TableCell>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                background: supplier.isAvailable ? '#e8f5e9' : '#ffebee',
                                color: supplier.isAvailable ? '#2e7d32' : '#c62828'
                              }}>
                                {supplier.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleOpenNotify(supplier._id)}
                                disabled={!supplier.isAvailable}
                                sx={{ 
                                  opacity: supplier.isAvailable ? 1 : 0.5,
                                  cursor: supplier.isAvailable ? 'pointer' : 'not-allowed'
                                }}
                              >
                                Notify
                              </Button>
                              {!supplier.isAvailable && (
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                                  Supplier unavailable
                                </div>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={activeTab === 0 ? 6 : 6} align="center">
                        {activeTab === 0 ? 'No pending suppliers.' : 'No approved suppliers.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </main>
    </div>
  );
}
