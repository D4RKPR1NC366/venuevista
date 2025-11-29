# 🚀 Goldust Deployment Guide - Hostinger + Render

## Overview
Your Goldust app uses a **split deployment** strategy:
- **Frontend (React)**: Deployed to Hostinger as static files
- **Backend (Node.js)**: Deployed to Render as a web service

## 📋 Prerequisites
- Hostinger hosting account
- Render account (free tier available)
- All localhost connections migrated to Atlas (✅ COMPLETED)

## 🎯 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account

### 1.2 Deploy Backend
1. **Create New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

2. **Configuration**:
   ```
   Name: goldust-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables** (Add in Render Dashboard):
   ```
   ATLAS_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
   PORT=5051
   JWT_SECRET=your-jwt-secret-here
   NODE_ENV=production
   ```

4. **Deploy**: Click "Create Web Service"

### 1.3 Get Your Render URL
After deployment, you'll get a URL like: `https://goldust-backend-xxxx.onrender.com`

## 🎯 Step 2: Update Frontend API URL

### 2.1 Update API Configuration
Replace `YOUR_RENDER_URL_HERE` in `client/src/services/api.js`:

```javascript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://goldust-backend-xxxx.onrender.com/api'  // ← Your actual Render URL
  : '/api';
```

### 2.2 Build Frontend
```bash
npm run build
```

## 🎯 Step 3: Deploy Frontend to Hostinger

### 3.1 Access File Manager
1. Log in to Hostinger
2. Go to **File Manager**
3. Navigate to `public_html/` (or your domain's root folder)

### 3.2 Upload Files
1. **Upload ALL contents** of `client/dist/` folder
2. **DO NOT upload the `dist` folder itself** - upload its contents
3. Files to upload:
   ```
   index.html
   assets/ (folder with CSS/JS files)
   .htaccess (for React routing)
   ```

### 3.3 Verify Upload
Your `public_html/` should look like:
```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── .htaccess
```

## 🔧 Step 4: Test Deployment

### 4.1 Test Backend
Visit your Render URL: `https://goldust-backend-xxxx.onrender.com/`
You should see: `{"message":"Goldust API is running"}`

### 4.2 Test Frontend
Visit your Hostinger domain
The React app should load and connect to your Render backend

## 🚨 Troubleshooting

### CORS Issues
If you get CORS errors, verify in `server/index.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://goldust.com',           // ← Your Hostinger domain
    'https://www.goldust.com'       // ← With www prefix
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};
```

### Backend Not Starting
Check Render logs for database connection issues or missing environment variables.

### Frontend Not Loading
1. Verify all files uploaded correctly
2. Check `.htaccess` file is present
3. Check browser developer console for errors

## 📝 Quick Commands

```bash
# Build frontend
npm run build

# Test backend locally with Atlas
npm run start:server

# Run migration (if needed)
npm run migrate
```

## 🎉 Success Checklist
- [ ] Backend deployed to Render
- [ ] Environment variables set in Render
- [ ] API URL updated with actual Render URL
- [ ] Frontend built with production settings
- [ ] All `client/dist/` contents uploaded to Hostinger
- [ ] Website loads and connects to backend
- [ ] User registration/login works
- [ ] Database operations work through Atlas

---

**Need Help?** Check the Render and Hostinger logs, or verify your MongoDB Atlas connection strings.