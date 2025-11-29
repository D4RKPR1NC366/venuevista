# MongoDB Atlas Backup System

## Overview
This system automatically backs up your account and booking data from local MongoDB databases to MongoDB Atlas cloud storage for disaster recovery and data protection.

## What Gets Backed Up
- **Customer Accounts** (authentication database)
- **Supplier Accounts** (authentication database)  
- **Bookings** (booking database)
- **Reviews** (reviews database)

## How It Works

### Automatic Backup
- Runs every **5 minutes** automatically when the server starts
- Syncs data from local MongoDB to Atlas using upsert operations
- Adds `lastBackupSync` timestamp to track when each record was last backed up

### Manual Backup
- Access the admin panel at `/admin/atlas-backup`
- Click "Trigger Manual Backup" to run an immediate backup
- View backup status and statistics

## Files Added

### Server Files
- `server/config/atlas.js` - Atlas connection and schema definitions
- `server/services/backupService.js` - Core backup logic and scheduling
- `server/routes/backup.js` - API endpoints for backup management
- `server/testAtlas.js` - Connection testing utility

### Client Files  
- `client/src/Admin/AtlasBackup.jsx` - Admin interface for backup management
- `client/src/Admin/atlas-backup.css` - Styling for backup interface

## Atlas Configuration
- **Connection String**: `mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/`
- **Cluster**: goldust.9lkqckv.mongodb.net
- **Databases**: authentication, booking, reviews

## API Endpoints
- `GET /api/backup/status` - Get current backup status
- `POST /api/backup/trigger` - Trigger manual backup
- `GET /api/backup/history` - Get backup history

## Usage

### Starting the System
The backup service starts automatically when you run your server:
```bash
cd server
node index.js
```

### Testing Atlas Connection
```bash
cd server
node testAtlas.js
```

### Monitoring Backups
1. Access your admin dashboard
2. Navigate to the Atlas Backup section
3. View status, trigger manual backups, and monitor sync progress

## Benefits
- **Disaster Recovery**: Your data is safely stored in the cloud
- **Data Migration**: Easy to move between environments
- **Peace of Mind**: Automatic, scheduled backups without manual intervention
- **Real-time Sync**: Data is kept up-to-date with minimal delay

## Technical Details
- Uses MongoDB's `findOneAndUpdate` with `upsert: true` for efficient syncing
- Handles connection pooling and error recovery
- Includes comprehensive logging and error handling
- Non-blocking operations won't affect your main application performance

Your backup system is now active and protecting your important account and booking data!