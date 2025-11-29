const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');
const auth = require('../middleware/auth');

// Get backup status
router.get('/status', auth, async (req, res) => {
    try {
        const status = backupService.getStatus();
        res.json({
            success: true,
            status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Trigger manual backup
router.post('/trigger', auth, async (req, res) => {
    try {
        const result = await backupService.performFullBackup();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Backup completed successfully',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Backup failed',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get backup history/logs (basic implementation)
router.get('/history', auth, async (req, res) => {
    try {
        const status = backupService.getStatus();
        res.json({
            success: true,
            history: [{
                timestamp: status.lastBackupTime,
                status: status.isRunning ? 'running' : 'completed'
            }]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;