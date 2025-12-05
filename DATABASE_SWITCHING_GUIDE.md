# Database Switching Guide

This guide helps you switch between MongoDB Atlas (cloud) and localhost for easier development and demonstration.

## 🎯 Use Cases

### Use Localhost When:
- ✅ Demonstrating the system without internet
- ✅ Making frequent data changes/testing
- ✅ Want faster database access
- ✅ Need offline development
- ✅ Testing with sample data

### Use Atlas When:
- ✅ Deploying to production
- ✅ Collaborating with team members
- ✅ Need data accessible from anywhere
- ✅ Want automatic backups

---

## 📥 Initial Setup: Export Atlas Data to Local

Before switching to localhost, you need to have your data locally:

```powershell
# Export all data from Atlas
node export-all-data.js

# Import to local MongoDB
node import-to-local.js
```

**Result:** All your Atlas data is now in `mongodb://localhost:27017`

---

## 🔄 Switch Server Connections

### Switch to Localhost (for demos/testing)

```powershell
# Step 1: Switch connection strings in code
node switch-to-localhost.js

# Step 2: Restart your server
cd server
npm start
```

**What this does:**
- Changes all `mongodb+srv://...` to `mongodb://localhost:27017`
- Updates files: `server/index.js`, `server/routes/bookings.js`, `server/config/database.js`
- Your app now uses local MongoDB

**Verify:** Check console output - should say "Connected to localhost" instead of "Connected to Atlas"

---

### Switch Back to Atlas (for deployment)

```powershell
# Step 1: Switch connection strings back
node switch-to-atlas.js

# Step 2: Restart your server
cd server
npm start
```

**What this does:**
- Changes all `mongodb://localhost:27017` back to `mongodb+srv://...`
- Reverts to cloud database
- Your app now uses Atlas again

---

## 📤 Sync Local Changes Back to Atlas

If you made changes locally and want to push them to Atlas:

```powershell
# Push all local data to Atlas (OVERWRITES Atlas data!)
node sync-local-to-atlas.js
```

**⚠️ WARNING:** This will REPLACE all Atlas data with local data. Make sure you have a backup!

**What this does:**
1. Exports all data from `localhost:27017`
2. Saves backup to `mongodb-local-backup/`
3. Connects to Atlas
4. Clears Atlas collections
5. Imports local data to Atlas

---

## 📊 Complete Workflow Examples

### Example 1: Preparing for Demo

```powershell
# 1. Export fresh Atlas data
node export-all-data.js

# 2. Import to local
node import-to-local.js

# 3. Switch to localhost
node switch-to-localhost.js

# 4. Restart server
cd server
npm start

# ✅ Ready! Your demo uses local MongoDB
```

### Example 2: After Demo, Back to Development

```powershell
# 1. Switch back to Atlas
node switch-to-atlas.js

# 2. Restart server
cd server
npm start

# ✅ Back to cloud database
```

### Example 3: Made Changes Locally, Want to Keep Them

```powershell
# 1. Push local changes to Atlas
node sync-local-to-atlas.js

# 2. Switch to Atlas
node switch-to-atlas.js

# 3. Restart server
cd server
npm start

# ✅ Your local changes are now in Atlas
```

---

## 🔧 Quick Reference

| Command | What It Does |
|---------|--------------|
| `node export-all-data.js` | Downloads Atlas data to JSON files |
| `node import-to-local.js` | Imports JSON files to localhost |
| `node switch-to-localhost.js` | Changes code to use localhost |
| `node switch-to-atlas.js` | Changes code to use Atlas |
| `node sync-local-to-atlas.js` | Pushes local data to Atlas |

---

## 🗂️ File Changes Made by Scripts

### Modified by `switch-to-localhost.js`:
- `server/index.js` - All 8 database connections
- `server/routes/bookings.js` - Booking database
- `server/config/database.js` - Config file (if exists)

### Modified by `switch-to-atlas.js`:
- Same files, reverses changes

---

## 🛡️ Safety Tips

### Before Switching:
1. ✅ Commit your code to git
2. ✅ Export current database state
3. ✅ Make sure local MongoDB is running (if switching to localhost)

### Before Syncing to Atlas:
1. ✅ Backup Atlas data first: `node export-all-data.js`
2. ✅ Review what you're about to overwrite
3. ✅ Test thoroughly on localhost first

### General Best Practices:
- 🔄 Always keep backups in `mongodb-export/` folder
- 📝 Document which database you're currently using
- 🔍 Check console logs to verify correct database connection
- 💾 Regularly export Atlas data as backup

---

## 🐛 Troubleshooting

### "Cannot connect to localhost"
```powershell
# Start MongoDB Compass or install MongoDB Community
# MongoDB should run on port 27017
```

### "Cannot find module 'mongoose'"
```powershell
cd server
npm install
```

### "Switch script didn't change anything"
- Check if you're already on the target database
- Look for connection strings in console output
- Verify file paths are correct

### "Data didn't sync"
- Check internet connection for Atlas
- Verify Atlas credentials in `.env.production`
- Check if local MongoDB has data: Open Compass → `localhost:27017`

### Server won't start after switching
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Clear node cache
cd server
rm -rf node_modules
npm install

# Restart
npm start
```

---

## 📝 Current Database Connection

To check which database you're currently using:

### Check Code:
Open `server/index.js` and look for connection strings:
- `mongodb://localhost:27017` = Using localhost
- `mongodb+srv://goldust...` = Using Atlas

### Check Console:
When server starts, look for:
```
MongoDB booking connected!  // Check the connection message
```

### Check at Runtime:
In MongoDB Compass:
- Connect to `localhost:27017` - see if there's data
- Connect to Atlas - compare with local

---

## 🎓 For Thesis Defense / Demo

**Recommended Setup:**

1. **One Day Before:**
   ```powershell
   node export-all-data.js
   node import-to-local.js
   ```

2. **Morning of Demo:**
   ```powershell
   node switch-to-localhost.js
   cd server && npm start
   ```

3. **Benefits:**
   - ✅ No internet dependency
   - ✅ Faster response times
   - ✅ Can demo anywhere
   - ✅ Data persists if internet drops

4. **After Demo:**
   ```powershell
   node switch-to-atlas.js
   cd server && npm start
   ```

---

## 📚 Additional Resources

- [MongoDB Compass Download](https://www.mongodb.com/try/download/compass)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- Project backup location: `mongodb-export/` and `mongodb-local-backup/`

---

## 🆘 Emergency Commands

### If everything breaks:
```powershell
# 1. Stop all servers
taskkill /F /IM node.exe

# 2. Switch back to Atlas (original state)
node switch-to-atlas.js

# 3. Restore from backup
node import-to-local.js

# 4. Restart fresh
cd server
npm start
```

### Nuclear option (full reset):
```powershell
# Re-export everything from Atlas
node export-all-data.js

# Switch to Atlas
node switch-to-atlas.js

# Restart
cd server && npm start
```
