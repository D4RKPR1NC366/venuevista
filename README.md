# Goldust Creation Capstone - Production Deployment

A comprehensive event management system built with React frontend and Node.js backend, using MongoDB Atlas for data storage.

## 🚀 Live Application

This application is ready for Hostinger deployment via Git.

## 📁 Project Structure

```
├── server/              # Node.js backend
├── client/              # React frontend source
├── public_html/         # Built frontend files (for Hostinger)
├── .htaccess           # Apache configuration
└── package.json        # Root package configuration
```

## 🛠️ Technologies Used

- **Frontend**: React, Vite, Material-UI
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT with MFA support
- **File Upload**: Multer
- **Email**: Nodemailer

## 📊 Features

- **Admin Dashboard**: Manage bookings, products, suppliers, and gallery
- **Customer Portal**: Book events, view booking history, manage profile
- **Supplier Management**: Schedule management and booking responses
- **Gallery Management**: Image upload and categorization
- **Review System**: Customer feedback and ratings
- **Promo Management**: Discount codes and promotional offers
- **Calendar Integration**: Event scheduling and availability
- **Email Notifications**: MFA codes and booking confirmations

## 🔧 Environment Variables

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
JWT_SECRET=your-jwt-secret-key
PORT=5051
```

## 🚀 Deployment (Hostinger)

1. **Repository**: Connect to GitHub repository
2. **Branch**: my-final-branch
3. **Environment Variables**: Set in Hostinger control panel
4. **Static Files**: Served from `public_html/` directory
5. **API Routes**: Proxied through `.htaccess` to Node.js server

## 📱 Database Collections

- **ProductsAndServices**: Products, categories, cart items
- **authentication**: Users (customers & suppliers)
- **booking**: Pending, approved, finished bookings
- **scheduleCalendar**: Appointments and schedules
- **promosDatabase**: Promotional offers
- **backgroundImages**: UI background images
- **goldustGallery**: Gallery images
- **reviews**: Customer reviews and ratings

## 🔐 Security Features

- JWT authentication
- Multi-factor authentication (MFA)
- Password reset functionality
- CORS configuration
- Input validation
- Environment variable protection

## 📞 API Endpoints

- `/api/auth/*` - Authentication & user management
- `/api/bookings/*` - Booking management
- `/api/categories/*` - Product categories
- `/api/gallery/*` - Gallery management
- `/api/reviews/*` - Review system
- `/api/promos/*` - Promotional offers
- `/api/appointments/*` - Schedule management

## 🎨 Frontend Features

- Responsive design
- Material-UI components
- React Router for navigation
- Date picker integration
- File upload interface
- Real-time booking updates
- Admin dashboard with analytics

---

**Status**: ✅ Production Ready
**Last Updated**: November 2025