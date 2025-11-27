import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./Authentication/Login";
import SignUp from "./Authentication/SignUp";
import Home from "./Home/Home";
import Gallery from "./Home/Gallery";
import EventCart from "./Home/EventCart";
import PnSDetails from "./Home/PnSDetails";
import ForgotPasswordFlow from "./Authentication/ForgotPasswordFlow";
import ResetPassword from "./Authentication/ResetPassword";
import BookingInformation from "./Client/BookingInformation";
import BookSummary from "./Booking/BookSummary";
import BookAppointment from "./Booking/BookAppointment";
import Booking from "./Booking/Booking";

import Dashboard from "./Admin/Dashboard";
import AdminBooking from "./Admin/Booking";
import ProductsAndServices from "./Admin/ProductsAndServices";
import SecondProductsAndServices from "./Admin/SecondProductsAndServices";
import Reminders from "./Admin/Reminders";
import Calendars from "./Admin/Calendars";
import Suppliers from "./Admin/Suppliers";
import UserClients from "./Admin/UserClients";
import BackgroundGallery from "./Admin/BackgroundGallery";
import GoldustGallery from "./Admin/GoldustGallery";
import Promos from "./Admin/Promos";
import AdminSupplierSchedules from "./Admin/AdminSupplierSchedules";
import Policy from "./Home/Policy";
import AdminAppointment from "./Admin/AdminAppointment";
import "./App.css";

import PersonalInformation from "./Client/PersonalInformation";
import Notification from "./Client/Notification";
import ClientSidebar from "./Client/ClientSidebar";
import UserCalendar from "./Client/UserCalendar";

import Reviews from "./Home/Reviews";

import { Navigate } from "react-router-dom";
import { AdminRoute, ClientRoute, AuthenticatedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
  <Routes>
    {/* Public routes - accessible to everyone */}
    <Route path="/" element={<Home />} />
    <Route path="/home" element={<Home />} />
    <Route path="/policy" element={<Policy />} />
    <Route path="/reviews" element={<Reviews />} />
      <Route path="/gallery" element={<Gallery />} />
    
    {/* Auth routes - only accessible when NOT logged in */}
    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
    <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
    <Route path="/forgot-password" element={<ForgotPasswordFlow />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    
    {/* Authenticated user routes - requires login */}
    <Route path="/booking" element={<AuthenticatedRoute><Booking /></AuthenticatedRoute>} />
    <Route path="/booking-summary" element={<AuthenticatedRoute><BookSummary /></AuthenticatedRoute>} />
    <Route path="/book-appointment" element={<AuthenticatedRoute><BookAppointment /></AuthenticatedRoute>} />
    <Route path="/pns-details" element={<AuthenticatedRoute><PnSDetails /></AuthenticatedRoute>} />
    <Route path="/event-cart" element={<AuthenticatedRoute><EventCart /></AuthenticatedRoute>} />
    
    {/* Admin routes - requires admin role */}
    <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
    <Route path="/admin/booking" element={<AdminRoute><AdminBooking /></AdminRoute>} />
    <Route path="/admin/products-services" element={<AdminRoute><ProductsAndServices /></AdminRoute>} />
    <Route path="/admin/second-products-and-services/:categoryId" element={<AdminRoute><SecondProductsAndServices /></AdminRoute>} />
    <Route path="/admin/reminders" element={<AdminRoute><Reminders /></AdminRoute>} />
    <Route path="/admin/calendars" element={<AdminRoute><Calendars /></AdminRoute>} />
    <Route path="/admin/suppliers" element={<AdminRoute><Suppliers /></AdminRoute>} />
    <Route path="/admin/user-clients" element={<AdminRoute><UserClients /></AdminRoute>} />
    <Route path="/admin/appointments" element={<AdminRoute><AdminAppointment /></AdminRoute>} />
    <Route path="/admin/background-gallery" element={<AdminRoute><BackgroundGallery /></AdminRoute>} />
      <Route path="/admin/goldust-gallery" element={<AdminRoute><GoldustGallery /></AdminRoute>} />
    <Route path="/admin/supplier-schedules" element={<AdminRoute><AdminSupplierSchedules /></AdminRoute>} />
    <Route path="/admin/promos" element={<AdminRoute><Promos /></AdminRoute>} />
    
    {/* Client routes - requires customer/supplier role (not admin) */}
    <Route path="/client/home" element={<ClientRoute><Home /></ClientRoute>} />
    <Route path="/client/personal-information" element={<ClientRoute><PersonalInformation /></ClientRoute>} />
    <Route path="/client/profile" element={<ClientRoute><PersonalInformation /></ClientRoute>} />
    <Route path="/client/booking-information" element={<ClientRoute><BookingInformation /></ClientRoute>} />
    <Route path="/client/notification" element={<ClientRoute><Notification /></ClientRoute>} />
    <Route path="/client/calendar" element={<ClientRoute><UserCalendar /></ClientRoute>} />
    
    {/* Logout */}
    <Route path="/logout" element={<Navigate to="/login" replace />} />
  </Routes>
    </Router>
  );
}

export default App;
