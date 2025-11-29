import React, { useState, useEffect } from 'react';
import './atlas-backup.css';

const AtlasBackup = () => {
    const [backupStatus, setBackupStatus] = useState({
        isRunning: false,
        lastBackupTime: null,
        backupInterval: 300000
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchBackupStatus();
        // Refresh status every 30 seconds
        const interval = setInterval(fetchBackupStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchBackupStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/backup/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBackupStatus(data.status);
            } else {
                console.error('Failed to fetch backup status');
            }
        } catch (error) {
            console.error('Error fetching backup status:', error);
        }
    };

    const triggerManualBackup = async () => {
        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/backup/trigger', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Backup completed successfully! Synced ${data.data.recordsSynced} records in ${data.data.duration}ms`);
                fetchBackupStatus(); // Refresh status
            } else {
                setMessage(`Backup failed: ${data.error}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    const formatInterval = (ms) => {
        return `${ms / 1000 / 60} minutes`;
    };

    return (
        <div className="atlas-backup-container">
            <div className="atlas-backup-header">
                <h2>MongoDB Atlas Backup</h2>
                <p>Automatic backup of accounts and bookings to MongoDB Atlas</p>
            </div>

            <div className="backup-status-card">
                <h3>Backup Status</h3>
                <div className="status-grid">
                    <div className="status-item">
                        <label>Current Status:</label>
                        <span className={`status-badge ${backupStatus.isRunning ? 'running' : 'idle'}`}>
                            {backupStatus.isRunning ? 'Running' : 'Idle'}
                        </span>
                    </div>
                    <div className="status-item">
                        <label>Last Backup:</label>
                        <span>{formatDate(backupStatus.lastBackupTime)}</span>
                    </div>
                    <div className="status-item">
                        <label>Backup Interval:</label>
                        <span>{formatInterval(backupStatus.backupInterval)}</span>
                    </div>
                </div>
            </div>

            <div className="backup-actions">
                <button 
                    className="manual-backup-btn"
                    onClick={triggerManualBackup}
                    disabled={loading || backupStatus.isRunning}
                >
                    {loading ? 'Running Backup...' : 'Trigger Manual Backup'}
                </button>
            </div>

            {message && (
                <div className={`backup-message ${message.includes('failed') || message.includes('Error') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="backup-info">
                <h3>Backup Information</h3>
                <ul>
                    <li><strong>Customer Accounts:</strong> All customer account data including profiles and authentication</li>
                    <li><strong>Supplier Accounts:</strong> All supplier account data including company information</li>
                    <li><strong>Bookings:</strong> All booking records including appointments and services</li>
                    <li><strong>Reviews:</strong> All customer reviews and ratings</li>
                </ul>
                <p className="backup-note">
                    <strong>Note:</strong> Backups run automatically every 5 minutes. The data is securely stored in MongoDB Atlas 
                    and can be used for disaster recovery or data migration.
                </p>
            </div>

            <div className="atlas-connection">
                <h3>Atlas Connection</h3>
                <p><strong>Cluster:</strong> goldust.9lkqckv.mongodb.net</p>
                <p><strong>Database:</strong> Multiple databases (authentication, booking, reviews)</p>
                <div className="connection-status">
                    <span className="connection-indicator active"></span>
                    Connected to MongoDB Atlas
                </div>
            </div>
        </div>
    );
};

export default AtlasBackup;