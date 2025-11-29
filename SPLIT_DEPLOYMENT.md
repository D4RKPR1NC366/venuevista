# 🚀 SPLIT DEPLOYMENT GUIDE: Hostinger + Render

## 📋 Overview
- **Frontend (React)**: Hostinger (static hosting)
- **Backend (Node.js/Express)**: Render (Node.js hosting)
- **Database**: MongoDB Atlas (already configured)

---

## 🖥️ BACKEND DEPLOYMENT (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### Step 2: Deploy Backend to Render
1. **Create New Web Service**
2. **Connect Repository**: `erxs999/Goldust-Creation-Capstone`
3. **Configuration**:
   - **Name**: `goldust-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `resave-branch`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (for testing)

### Step 3: Set Environment Variables in Render
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
JWT_SECRET=goldust-production-jwt-secret-key-2024
PORT=10000
```

### Step 4: Get Your Render URL
After deployment, you'll get a URL like:
`https://goldust-backend.onrender.com`

---

## 🌐 FRONTEND DEPLOYMENT (Hostinger)

### Step 1: Update API URL
The client is already configured to use your Render backend URL in production.
Update this line in `client/src/services/api.js` with your actual Render URL:
```javascript
? 'https://YOUR-RENDER-URL.onrender.com/api'
```

### Step 2: Build Frontend
```bash
cd client
npm run build
```

### Step 3: Upload to Hostinger
1. **File Manager** in Hostinger control panel
2. **Upload** the contents of `client/dist/` to your domain's `public_html/`
3. **Create** `.htaccess` file in `public_html/`:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Set proper MIME types
AddType application/javascript .js
AddType text/css .css
```

---

## 🔧 DEVELOPMENT WORKFLOW

### Local Development:
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm run dev
```

### Production Updates:
1. **Backend**: Push to GitHub → Render auto-deploys
2. **Frontend**: Run `npm run build` → Upload `dist/` to Hostinger

---

## 🎯 FINAL STEPS

1. **Deploy backend** to Render first
2. **Update** API URL in client with your Render URL
3. **Build and upload** frontend to Hostinger
4. **Test** the live application

Your app will be:
- **Frontend**: `https://your-domain.com` (Hostinger)
- **Backend**: `https://your-app.onrender.com` (Render)
- **Database**: MongoDB Atlas

## 🔍 Troubleshooting

**CORS Errors**: Make sure your Hostinger domain is added to the CORS origins in `server/index.js`

**API Not Loading**: Check that the Render URL in `api.js` is correct

**Build Errors**: Ensure all dependencies are in `package.json`