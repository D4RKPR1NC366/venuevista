
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './suppliers.css';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Tabs, Tab, Box } from '@mui/material';

export default function Suppliers() {
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [approvedSuppliers, setApprovedSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

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

  // Filter suppliers by search
  const currentSuppliers = activeTab === 0 ? pendingSuppliers : approvedSuppliers;
  const filteredSuppliers = currentSuppliers.filter(supplier => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (supplier.companyName || '').toLowerCase().includes(q) ||
      (supplier.firstName || '').toLowerCase().includes(q) ||
      (supplier.middleName || '').toLowerCase().includes(q) ||
      (supplier.lastName || '').toLowerCase().includes(q) ||
      (supplier.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="admin-suppliers-root">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Supplier Management</h2>
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
                    {activeTab === 0 && <TableCell>Actions</TableCell>}
                    {activeTab === 1 && <TableCell>Approved Date</TableCell>}
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
                            >
                              Reject
                            </Button>
                          </TableCell>
                        )}
                        {activeTab === 1 && (
                          <TableCell>
                            {supplier.approvedAt ? new Date(supplier.approvedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={activeTab === 0 ? 5 : 5} align="center">
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
