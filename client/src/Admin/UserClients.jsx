import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './userclients.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box } from '@mui/material';
import LocationSelector from '../components/LocationSelector';
import api from '../services/api';

export default function UserClients() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  
  // Edit customer state
  const [editOpen, setEditOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    province: '',
    city: '',
    barangay: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by name and location
  const filteredUsers = customers.filter(user => {
    const q = search.trim().toLowerCase();
    const locQ = locationSearch.trim().toLowerCase();
    let matchesName = true;
    let matchesLocation = true;
    if (q) {
      matchesName = (
        (user.firstName || '').toLowerCase().includes(q) ||
        (user.lastName || '').toLowerCase().includes(q) ||
        (user.middleName || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q)
      );
    }
    if (locQ) {
      matchesLocation = (
        (user.barangay || '').toLowerCase().includes(locQ) ||
        (user.city || '').toLowerCase().includes(locQ) ||
        (user.province || '').toLowerCase().includes(locQ)
      );
    }
    return matchesName && matchesLocation;
  });

  const fetchCustomers = () => {
    api.get('/customers')
      .then((res) => {
        setCustomers(res.data);
        console.log('Loaded customers:', res.data);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      });
  };

  // Handler to show password after admin authentication
  const handleShowPassword = async (userId) => {
    const adminPassword = window.prompt('Enter admin password to view user password:');
    if (adminPassword === 'admin123') {
      setVisiblePasswords(prev => ({ ...prev, [userId]: true }));
    } else if (adminPassword !== null) {
      window.alert('Incorrect admin password.');
    }
  };

  const handleOpenEdit = (customer) => {
    setEditCustomer(customer);
    setEditForm({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      middleName: customer.middleName || '',
      email: customer.email || '',
      phone: customer.phone || customer.contact || customer.phoneNumber || '',
      province: customer.province || '',
      city: customer.city || '',
      barangay: customer.barangay || ''
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditCustomer(null);
    setEditForm({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      province: '',
      city: '',
      barangay: ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/customers/${editCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) throw new Error('Failed to update customer');
      
      alert('Customer updated successfully!');
      handleCloseEdit();
      fetchCustomers();
    } catch (err) {
      alert('Error updating customer: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete customer');
      
      alert('Customer deleted successfully!');
      fetchCustomers();
    } catch (err) {
      alert('Error deleting customer: ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-userclients-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 16 }}>
            <h2 style={{ margin: 0 }}>Users / Clients</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  minWidth: 180,
                  background: '#fff',
                  color: '#222',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: 500
                }}
              />
              <input
                type="text"
                placeholder="Search location..."
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  minWidth: 180,
                  background: '#fff',
                  color: '#222',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: 500
                }}
              />
            </div>
          </div>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Middle Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Email Address</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Password</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.middleName || ''}</TableCell>
                      <TableCell>{user.contact || user.phone || user.phoneNumber || ''}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{
                        [user.barangay, user.city, user.province]
                          .filter(Boolean)
                          .join(', ') || '-'
                      }</TableCell>
                      <TableCell>
                        {visiblePasswords[user._id]
                          ? <span>{user.password}{user.businessName && ` (Supplier - ${user.businessName})`}</span>
                          : <>
                              <span style={{ letterSpacing: 2 }}>••••••••</span>
                              <button
                                style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontSize: '0.9rem' }}
                                onClick={() => handleShowPassword(user._id)}
                              >Show</button>
                              {user.businessName && <span style={{ marginLeft: 8 }}>(Supplier - {user.businessName})</span>}
                            </>
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => handleOpenEdit(user)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Edit Customer Dialog */}
          <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Customer Details</DialogTitle>
            <form onSubmit={handleEditSubmit}>
              <DialogContent dividers>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="First Name"
                    value={editForm.firstName}
                    onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Last Name"
                    value={editForm.lastName}
                    onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Middle Name"
                    value={editForm.middleName}
                    onChange={e => setEditForm(f => ({ ...f, middleName: e.target.value }))}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  fullWidth
                  required
                  margin="normal"
                />
                <TextField
                  label="Phone"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  fullWidth
                  required
                  margin="normal"
                />
                <LocationSelector
                  value={{
                    province: editForm.province,
                    city: editForm.city,
                    barangay: editForm.barangay
                  }}
                  onChange={(location) => setEditForm(f => ({
                    ...f,
                    province: location.province,
                    city: location.city,
                    barangay: location.barangay
                  }))}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseEdit} color="secondary">Cancel</Button>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
