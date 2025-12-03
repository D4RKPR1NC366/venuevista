# Deployment Guide for Render

This guide will walk you through deploying the Goldust Creation Capstone application to Render. The application consists of two separate services:
- **Server** (Node.js/Express backend)
- **Client** (React/Vite frontend)

## Prerequisites

1. A [Render](https://render.com) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. MongoDB Atlas connection string
4. Email credentials for notifications

---

## Part 1: Deploy the Server (Backend)

### Step 1: Create a New Web Service

1. Log in to your Render dashboard
2. Click **"New +"** and select **"Web Service"**
3. Connect your Git repository
4. Configure the service:
   - **Name**: `goldust-server` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `pre-deployment` (or your main branch)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

### Step 2: Configure Environment Variables

In the **Environment** section, add the following environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `MONGODB_URI` | `mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/` | Your MongoDB Atlas connection (without database name) |
| `JWT_SECRET` | `your-strong-secret-key` | Use a strong random string |
| `EMAIL_USER` | `truegoldustcreation@gmail.com` | Your email for notifications |
| `EMAIL_PASS` | `your-app-password` | Gmail app password (not regular password) |
| `CLIENT_URL` | Leave blank for now | We'll update this after deploying the client |

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait for the deployment to complete (5-10 minutes)
3. Once deployed, copy your server URL (e.g., `https://goldust-server.onrender.com`)

### Step 4: Update CLIENT_URL

1. Go back to your server's **Environment** settings
2. Update the `CLIENT_URL` variable with your client URL (we'll get this in Part 2)
3. This is needed for CORS to work properly

---

## Part 2: Deploy the Client (Frontend)

### Step 1: Update Environment Variables Locally

Before deploying the client, update your local `.env.production` file:

```env
VITE_API_URL=https://goldust-server.onrender.com
```

Replace `https://goldust-server.onrender.com` with your actual server URL from Part 1.

**Commit and push these changes to your repository.**

### Step 2: Create a New Static Site

1. In Render dashboard, click **"New +"** and select **"Static Site"**
2. Connect your Git repository (same as server)
3. Configure the static site:
   - **Name**: `goldust-client` (or your preferred name)
   - **Region**: Choose same as server
   - **Branch**: `pre-deployment` (or your main branch)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Step 3: Configure Auto-Deploy

Render will automatically deploy when you push to your branch. You can also manually trigger deploys from the dashboard.

### Step 4: Deploy

1. Click **"Create Static Site"**
2. Wait for the deployment to complete (5-10 minutes)
3. Once deployed, copy your client URL (e.g., `https://goldust-client.onrender.com`)

### Step 5: Update Server CORS Settings

1. Go back to your **server** web service in Render
2. Navigate to **Environment** settings
3. Update the `CLIENT_URL` variable with your client URL
4. Click **"Save Changes"**
5. The server will automatically redeploy

---

## Part 3: Verify Deployment

### Test the Application

1. Visit your client URL (e.g., `https://goldust-client.onrender.com`)
2. Try the following:
   - Sign up / Login functionality
   - Browse products and services
   - Check if images load correctly
   - Test booking functionality
   - Verify admin features (if applicable)

### Monitor Logs

If you encounter issues:

1. **Server Logs**: Go to your server web service → **Logs** tab
2. **Client Logs**: Go to your static site → **Events** tab
3. Check for any error messages

---

## Important Notes

### Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month of runtime

### MongoDB Connection

Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Render's IP addresses to your whitelist.

### Environment Variables

- **Never commit** `.env.production` files with real secrets to Git
- Use the `.env.example` files as templates
- All environment variables are managed through Render's dashboard

### Custom Domain (Optional)

To use a custom domain:
1. Go to your service settings
2. Navigate to **Custom Domains**
3. Follow Render's instructions to configure DNS

---

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify `CLIENT_URL` is set correctly in server environment variables
2. Ensure the URL includes `https://` and no trailing slash
3. Redeploy the server after updating

### API Connection Issues

If the client can't reach the server:
1. Check that `VITE_API_URL` in `.env.production` matches your server URL
2. Verify the server is running (check server logs)
3. Test the server API directly using the URL

### MongoDB Connection Errors

If you see MongoDB connection errors:
1. Verify `MONGODB_URI` is correct in server environment variables
2. Check MongoDB Atlas network access settings
3. Ensure the connection string doesn't include the database name

### Images Not Loading

If images don't load:
1. Check that the server is serving static files correctly
2. Verify upload paths in the server code
3. Check browser console for 404 errors

---

## Maintenance

### Updating the Application

1. Make changes to your code locally
2. Test thoroughly
3. Commit and push to your Git repository
4. Render will automatically deploy the changes

### Manual Redeploy

If you need to manually redeploy:
1. Go to your service in Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Monitoring

Regularly check:
- Application logs for errors
- Performance metrics in Render dashboard
- User feedback

---

## Support

For issues specific to:
- **Render**: Check [Render Documentation](https://render.com/docs)
- **MongoDB**: Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- **Application**: Review server logs and client console errors

---

## Summary Checklist

- [ ] Server deployed to Render
- [ ] Server environment variables configured
- [ ] Client `.env.production` updated with server URL
- [ ] Client deployed to Render
- [ ] Server `CLIENT_URL` updated with client URL
- [ ] Application tested and working
- [ ] MongoDB connection verified
- [ ] Email notifications tested
- [ ] All features working correctly

**Congratulations! Your application is now live on Render!** 🎉
