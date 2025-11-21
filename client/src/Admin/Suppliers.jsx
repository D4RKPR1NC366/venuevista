
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './suppliers.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/suppliers');
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        const data = await res.json();
        setSuppliers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Filter suppliers by search
  const filteredSuppliers = suppliers.filter(supplier => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (supplier.companyName || '').toLowerCase().includes(q) ||
      (supplier.firstName || '').toLowerCase().includes(q) ||
      (supplier.middleName || '').toLowerCase().includes(q) ||
      (supplier.lastName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-suppliers-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Suppliers</h2>
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
          {loading ? (
            <p>Loading suppliers...</p>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company Name</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Middle Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Password</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {error ? null : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier._id}>
                        <TableCell>{supplier.companyName}</TableCell>
                        <TableCell>{supplier.firstName}</TableCell>
                        <TableCell>{supplier.lastName}</TableCell>
                        <TableCell>{supplier.middleName}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.password}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No suppliers found.</TableCell>
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
