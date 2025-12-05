# MongoDB Atlas Export/Import Guide

This guide will help you export all data from MongoDB Atlas and import it into MongoDB Compass (local MongoDB).

## Prerequisites

1. **MongoDB Compass installed** on your computer
2. **Node.js and npm** installed
3. Your Atlas connection credentials (already configured in `.env.production`)

## Step 1: Export Data from Atlas

This will download ALL data from all your MongoDB Atlas databases to your local computer.

```powershell
# Run the export script from server directory (where mongoose is installed)
cd server
node export-all-data.js
```

**What this does:**
- Connects to each of your 8 Atlas databases
- Downloads all collections from each database
- Saves data as JSON files in `mongodb-export/` folder
- Creates a folder structure: `mongodb-export/[database-name]/[collection-name].json`

**Expected output:**
```
🚀 Starting MongoDB Atlas export...

📁 Export directory: C:\...\mongodb-export

🔄 Exporting database: authentication
✅ Connected to authentication
📦 Found 2 collections
  📄 Exporting collection: users
  ✅ Exported 15 documents to users.json
  ...

✅ All databases exported successfully!
```

## Step 2: Install and Run Local MongoDB (if not already running)

### Option A: Using MongoDB Community Edition
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run on `mongodb://localhost:27017`

### Option B: Using MongoDB Compass (easier)
1. Open MongoDB Compass
2. It will automatically connect to local MongoDB
3. If not running, Compass will offer to install it

## Step 3: Import Data to Local MongoDB

Once you have local MongoDB running and your data exported:

```powershell
# Run the import script from server directory
cd server
node import-to-local.js
```

**What this does:**
- Connects to your local MongoDB at `localhost:27017`
- Creates databases with the same names as Atlas
- Imports all collections and documents
- Preserves all data structure and relationships

**Expected output:**
```
🚀 Starting local MongoDB import...

Found 8 databases to import:
  - authentication
  - booking
  - ProductsAndServices
  ...

🔄 Importing database: authentication
✅ Connected to local MongoDB: authentication
📦 Found 2 collections to import
  📄 Importing collection: users
  ✅ Imported 15 documents to users
  ...

✅ All databases imported successfully to local MongoDB!
```

## Step 4: View Data in Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You should see all your databases:
   - `authentication`
   - `booking`
   - `ProductsAndServices`
   - `promosDatabase`
   - `scheduleCalendar`
   - `backgroundImages`
   - `goldustGallery`
   - `notification`

## Database Structure

Your exported data will have this structure:

```
mongodb-export/
├── authentication/
│   ├── users.json
│   └── sessions.json
├── booking/
│   ├── pendingbookings.json
│   ├── approvedbookings.json
│   └── finishedbookings.json
├── ProductsAndServices/
│   ├── categories.json
│   ├── products.json
│   └── secondarycategories.json
├── promosDatabase/
│   └── promos.json
├── scheduleCalendar/
│   ├── schedules.json
│   ├── appointments.json
│   └── supplieraccepteds.json
├── backgroundImages/
│   └── backgrounds.json
├── goldustGallery/
│   └── galleryimages.json
└── notification/
    └── notifications.json
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Make sure local MongoDB is running
- Check if port 27017 is available
- Try restarting MongoDB service

### "Export directory not found"
- Run `node export-all-data.js` first
- Check that `mongodb-export/` folder was created

### "Connection timeout"
- Check your internet connection
- Verify Atlas credentials in `.env.production`
- Make sure Atlas IP whitelist includes your IP

### "Out of memory" during export
- Export databases one at a time by commenting out others in the script
- Close other applications to free up RAM

## Manual Import (Alternative)

If the import script doesn't work, you can manually import using Compass:

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Click "Create Database"
4. Enter database name (e.g., "authentication")
5. For each collection:
   - Click "Create Collection"
   - Name it (e.g., "users")
   - Click "Add Data" → "Import File"
   - Select the corresponding JSON file
   - Click "Import"

## Re-exporting to Atlas (Optional)

If you want to push local changes back to Atlas:

1. Use MongoDB Compass to connect to Atlas
2. Use the export/import functionality in Compass
3. Or use `mongodump` and `mongorestore` CLI tools

## Notes

⚠️ **Important:**
- The import script CLEARS existing data in local collections before importing
- If you want to preserve existing data, comment out the `deleteMany()` line in `import-to-local.js`
- Always backup your Atlas data before making major changes

💡 **Tips:**
- Export regularly as a backup strategy
- Keep the `mongodb-export/` folder backed up
- You can zip the export folder for easy sharing/storage
- The JSON files are human-readable and can be edited if needed
