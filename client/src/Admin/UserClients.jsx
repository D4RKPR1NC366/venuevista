import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './userclients.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import api from '../services/api';

export default function UserClients() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    // Fetch customers only
    api.get('/customers')
      .then((res) => {
        setCustomers(res.data);
        console.log('Loaded customers:', res.data);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      });
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
        (user.address || '').toLowerCase().includes(locQ) ||
        (user.city || '').toLowerCase().includes(locQ) ||
        (user.branch || '').toLowerCase().includes(locQ)
      );
    }
    return matchesName && matchesLocation;
  });

  // Handler to show password after admin authentication
  const handleShowPassword = async (userId) => {
    const adminPassword = window.prompt('Enter admin password to view user password:');
    // Replace this with your actual admin password check
    // For demo, hardcoded password is 'admin123'. In production, use a secure API call.
    if (adminPassword === 'admin123') {
      setVisiblePasswords(prev => ({ ...prev, [userId]: true }));
    } else if (adminPassword !== null) {
      window.alert('Incorrect admin password.');
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </main>
    </div>
  );
}
