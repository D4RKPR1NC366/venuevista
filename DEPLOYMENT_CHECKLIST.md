# 🚀 Render Deployment Quick Checklist

## Pre-Deployment (Do Once)

### ✅ Local Setup
- [ ] All code changes committed to Git
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.production` files are NOT committed (check .gitignore)
- [ ] MongoDB Atlas cluster is running
- [ ] MongoDB Atlas allows connections from 0.0.0.0/0

### ✅ Verify Files Exist
- [ ] `server/render.yaml`
- [ ] `server/.env.example`
- [ ] `client/render.yaml`
- [ ] `client/.env.example`
- [ ] `client/src/utils/api.js`
- [ ] `RENDER_DEPLOYMENT.md`
- [ ] No `vercel.json` files present

---

## Deployment Steps

### 1️⃣ Deploy Server (Backend)

- [ ] Create new Web Service on Render
- [ ] Connect Git repository
- [ ] Set root directory: `server`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `MONGODB_URI` = `mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/`
  - [ ] `JWT_SECRET` = (your secret key)
  - [ ] `EMAIL_USER` = `truegoldustcreation@gmail.com`
  - [ ] `EMAIL_PASS` = (your email app password)
  - [ ] `CLIENT_URL` = (leave blank, update later)
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] **Copy server URL** (e.g., `https://goldust-server.onrender.com`)

### 2️⃣ Update Client Configuration

- [ ] Open `client/.env.production` locally
- [ ] Set `VITE_API_URL` to your server URL
- [ ] Commit and push changes

### 3️⃣ Deploy Client (Frontend)

- [ ] Create new Static Site on Render
- [ ] Connect same Git repository
- [ ] Set root directory: `client`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Click "Create Static Site"
- [ ] Wait for deployment to complete
- [ ] **Copy client URL** (e.g., `https://goldust-client.onrender.com`)

### 4️⃣ Update Server CORS

- [ ] Go back to server Web Service
- [ ] Navigate to Environment tab
- [ ] Update `CLIENT_URL` with your client URL
- [ ] Save changes
- [ ] Wait for automatic redeploy

---

## Post-Deployment Testing

### 🧪 Basic Tests
- [ ] Visit client URL - page loads
- [ ] No console errors in browser
- [ ] Login page displays correctly
- [ ] Signup page displays correctly

### 🧪 Authentication Tests
- [ ] Sign up new user (test email)
- [ ] Login with new user
- [ ] Logout works
- [ ] JWT token is stored

### 🧪 API Tests
- [ ] API calls return data (check Network tab)
- [ ] No CORS errors
- [ ] Images load correctly
- [ ] File uploads work (if applicable)

### 🧪 Database Tests
- [ ] Data is saved to MongoDB
- [ ] Data is retrieved correctly
- [ ] All collections accessible

### 🧪 Email Tests
- [ ] Email notifications are sent
- [ ] Email contains correct information

---

## Troubleshooting

### ❌ Server Won't Start
- Check Render server logs
- Verify all environment variables are set
- Check MongoDB connection string

### ❌ Client Shows Blank Page
- Check browser console for errors
- Verify build completed successfully
- Check Render static site logs

### ❌ CORS Errors
- Verify `CLIENT_URL` in server matches client URL exactly
- Must include `https://` and no trailing slash
- Redeploy server after updating

### ❌ API Connection Failed
- Verify `VITE_API_URL` in client `.env.production`
- Check server is running (green status in Render)
- Test server URL directly in browser

### ❌ MongoDB Connection Error
- Check MongoDB Atlas is running
- Verify IP whitelist (use 0.0.0.0/0 for Render)
- Check connection string format

---

## Useful Commands

### View Render Logs
```bash
# In Render dashboard
1. Go to your service
2. Click "Logs" tab
3. Monitor real-time logs
```

### Test API Endpoint
```bash
# Replace with your server URL
curl https://your-server-url.onrender.com/api/users
```

### Check Environment Variables
```bash
# In Render dashboard
1. Go to your service
2. Click "Environment" tab
3. Verify all variables are set
```

---

## Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub Repo**: (your repo URL)
- **Full Documentation**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

---

## Need Help?

1. Check [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed guide
2. Review [DEPLOYMENT_CHANGES.md](./DEPLOYMENT_CHANGES.md) for what changed
3. Check Render documentation: https://render.com/docs
4. Review server/client logs for error messages

---

**Remember**: 
- Free tier services spin down after 15 min of inactivity
- First request after spin-down takes 30-60 seconds
- Keep this checklist for future deployments!

🎉 **Good luck with your deployment!**
