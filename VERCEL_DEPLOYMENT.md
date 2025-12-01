# VenueVista - Goldust Creations Deployment Guide

## MERN Stack Vercel Deployment

This project uses:
- **MongoDB Atlas** (Database)
- **Express.js** (Backend)
- **React + Vite** (Frontend)
- **Node.js** (Runtime)

---

## 📋 Prerequisites

1. ✅ MongoDB Atlas account with connection string
2. ✅ Vercel account
3. ✅ GitHub account
4. ✅ All data migrated to Atlas (use `npm run migrate` in server folder)

---

## 🚀 Deployment Steps

### Step 1: Push to New Repository (Optional)

If you want a clean deployment repository:

```bash
# Create new repo on GitHub first, then:
git remote add deploy https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push deploy pre-deployment:main
```

### Step 2: Deploy Backend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

5. **Environment Variables** (IMPORTANT):
   ```
   MONGODB_URI = mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
   JWT_SECRET = your-super-secret-jwt-key
   EMAIL_USER = truegoldustcreation@gmail.com
   EMAIL_PASS = epvs rstu cjvq wohu
   NODE_ENV = production
   ```

6. Click **Deploy**

7. After deployment, copy your backend URL:
   ```
   https://your-project-name.vercel.app
   ```

### Step 3: Deploy Frontend to Vercel

**Option A: Separate Deployment (Recommended)**

1. Go to Vercel Dashboard
2. Click **"Add New Project"** again
3. Import the SAME repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend-url.vercel.app
   ```

6. Click **Deploy**

**Option B: Update Client API URL**

Edit `client/src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

---

## 🔧 Local Development

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

---

## 📝 Important Notes

### MongoDB Atlas Setup
- ✅ Whitelist Vercel IPs or use `0.0.0.0/0` (all IPs)
- ✅ Ensure connection string has correct username/password
- ✅ All collections migrated using `npm run migrate`

### File Uploads
⚠️ **Vercel has read-only filesystem**

Current file upload directories won't persist:
- `server/public/gallery` (gallery images)
- `server/uploads/reviews` (review images)

**Solutions**:
1. Use **Cloudinary** for image hosting
2. Use **AWS S3** for file storage
3. Use **Vercel Blob Storage**

### API Routes
After deployment:
- Backend API: `https://your-backend.vercel.app/api/*`
- Frontend: `https://your-frontend.vercel.app`

---

## 🐛 Troubleshooting

### Backend not working
- Check Vercel function logs
- Verify environment variables are set
- Test MongoDB Atlas connection

### Frontend API calls failing
- Update CORS settings in backend
- Verify API_URL points to backend deployment
- Check browser console for errors

### Images not loading
- Migrate to cloud storage (Cloudinary/S3)
- Update multer configuration

---

## 📦 Deployment Checklist

Backend:
- [ ] vercel.json created
- [ ] Environment variables set
- [ ] MongoDB Atlas whitelist configured
- [ ] index.js exports app module

Frontend:
- [ ] vercel.json in client folder
- [ ] API_URL updated to backend URL
- [ ] Build successful locally
- [ ] All routes working with SPA rewrites

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Cloudinary Setup](https://cloudinary.com/documentation)

---

## 👥 Support

For deployment issues, check:
1. Vercel deployment logs
2. MongoDB Atlas connection logs
3. Browser developer console
