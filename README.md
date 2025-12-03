# Goldust Creation Capstone - Quick Start Guide

## Project Structure

This is a full-stack MERN application with separate client and server directories:
- **`/client`** - React/Vite frontend
- **`/server`** - Express/Node.js backend

## Local Development Setup

### 1. Server Setup

```bash
cd server
npm install
```

Create `server/.env.production` from `server/.env.example`:
```env
MONGODB_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
JWT_SECRET=your-jwt-secret-key
EMAIL_USER=truegoldustcreation@gmail.com
EMAIL_PASS=your-email-app-password
PORT=5051
CLIENT_URL=http://localhost:5173
NODE_ENV=production
```

Start the server:
```bash
npm start
```

Server runs at `http://localhost:5051`

### 2. Client Setup

```bash
cd client
npm install
```

Create `client/.env.development` from `client/.env.example`:
```env
VITE_API_URL=http://localhost:5051
```

Start the dev server:
```bash
npm run dev
```

Client runs at `http://localhost:5173`

## Building for Production

### Build Client
```bash
cd client
npm run build
```

The built files will be in `client/dist/`

### Build Server
No build step needed - Node.js runs the source directly.

## Deployment to Render

See **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** for complete deployment instructions.

### Quick Deploy Steps:

1. **Deploy Server First**
   - Create Web Service on Render
   - Set root directory to `server`
   - Add environment variables
   - Note the server URL

2. **Deploy Client Second**
   - Update `client/.env.production` with server URL
   - Create Static Site on Render
   - Set root directory to `client`
   - Note the client URL

3. **Update Server CORS**
   - Add client URL to server's `CLIENT_URL` env var
   - Redeploy server

## Important Files

### Configuration Files
- `server/render.yaml` - Render server configuration
- `client/render.yaml` - Render client configuration
- `server/.env.example` - Server environment template
- `client/.env.example` - Client environment template

### Environment Variables
- **Server**: Uses `.env.production` for configuration
- **Client**: Uses `.env.development` (local) and `.env.production` (build)

### API Communication
- Use `client/src/utils/api.js` for API calls
- Automatically handles dev/prod URL differences
- Includes authentication headers

## Key Features

- Multi-database MongoDB setup (main, promos, schedules, bookings)
- JWT authentication with MFA support
- Email notifications
- File uploads (reviews, gallery)
- React Big Calendar integration
- Admin, Supplier, and Customer dashboards

## Scripts

### Server Scripts
- `npm start` - Start production server

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables Reference

### Server Required Variables
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas base connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `EMAIL_USER` | Email for sending notifications |
| `EMAIL_PASS` | Email app password |
| `PORT` | Server port (default: 5051) |
| `CLIENT_URL` | Frontend URL for CORS |
| `NODE_ENV` | Environment (production/development) |

### Client Required Variables
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Tech Stack

### Frontend
- React 19
- Vite
- Material-UI
- React Router
- React Big Calendar
- Recharts
- Axios

### Backend
- Node.js
- Express
- MongoDB/Mongoose
- JWT Authentication
- Nodemailer
- Multer (file uploads)
- bcryptjs

## Development Tips

1. **Always start server before client** in development
2. **Check CORS settings** if you get connection errors
3. **Use the api utility** (`utils/api.js`) for consistent API calls
4. **Monitor server logs** for backend errors
5. **Check browser console** for frontend errors

## Troubleshooting

### CORS Errors
- Verify `CLIENT_URL` in server env matches client URL
- Check server is running
- Clear browser cache

### API Connection Issues
- Verify `VITE_API_URL` in client env
- Check network tab in browser DevTools
- Verify server is accessible

### MongoDB Connection Issues
- Check MongoDB Atlas network access
- Verify connection string format
- Ensure IP whitelist includes your IP

### Build Issues
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

## Support

For deployment issues, refer to:
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Deployment guide
- [Render Documentation](https://render.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

---

**Note**: Never commit `.env` or `.env.production` files to Git. Use `.env.example` as templates.
