import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './userclients.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import api from '../services/api';

export default function UserClients() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
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

  // Filter customers by search
  const filteredUsers = customers.filter(user => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (user.firstName || '').toLowerCase().includes(q) ||
      (user.lastName || '').toLowerCase().includes(q) ||
      (user.middleName || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-userclients-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Users / Clients</h2>
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
                minWidth: 220,
                background: '#fff',
                color: '#222',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontWeight: 500
              }}
            />
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
                      <TableCell>
                        {user.password}
                        {user.businessName && ` (Supplier - ${user.businessName})`}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No users found.</TableCell>
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
