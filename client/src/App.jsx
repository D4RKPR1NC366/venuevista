import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./Authentication/Login";
import SignUp from "./Authentication/SignUp";
import Home from "./Home/Home";
import EventCart from "./Home/EventCart";
import PnSDetails from "./Home/PnSDetails";
import ForgotPasswordFlow from "./Authentication/ForgotPasswordFlow";
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
import AdminSupplierSchedules from "./Admin/AdminSupplierSchedules";
import Policy from "./Home/Policy";
import "./App.css";

import PersonalInformation from "./Client/PersonalInformation";
import Notification from "./Client/Notification";
import ClientSidebar from "./Client/ClientSidebar";
import UserCalendar from "./Client/UserCalendar";

import Reviews from "./Home/Reviews";

import { Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/home" element={<Home />} />
    <Route path="/booking" element={<Booking />} />
    <Route path="/booking-summary" element={<BookSummary />} />
    <Route path="/book-appointment" element={<BookAppointment />} />
    <Route path="/policy" element={<Policy />} />
    <Route path="/pns-details" element={<PnSDetails />} />
    <Route path="/event-cart" element={<EventCart />} />
  <Route path="/reviews" element={<Reviews />} />
    {/* Admin routes */}
    <Route path="/admin/dashboard" element={<Dashboard />} />
    <Route path="/admin/booking" element={<AdminBooking />} />
    <Route path="/admin/products-services" element={<ProductsAndServices />} />
    <Route path="/admin/second-products-and-services/:categoryId" element={<SecondProductsAndServices />} />
    <Route path="/admin/reminders" element={<Reminders />} />
    <Route path="/admin/calendars" element={<Calendars />} />
    <Route path="/admin/suppliers" element={<Suppliers />} />
    <Route path="/admin/user-clients" element={<UserClients />} />
  <Route path="/admin/background-gallery" element={<BackgroundGallery />} />
  <Route path="/admin/supplier-schedules" element={<AdminSupplierSchedules />} />
    <Route path="/forgot-password" element={<ForgotPasswordFlow />} />
    {/* Client routes */}
    <Route path="/client/home" element={<Home />} />
    <Route path="/client/personal-information" element={<PersonalInformation />} />
    <Route path="/client/profile" element={<PersonalInformation />} />
    <Route path="/client/booking-information" element={<BookingInformation />} />
    <Route path="/client/notification" element={<Notification />} />
    <Route path="/client/calendar" element={<UserCalendar />} />
    <Route path="/logout" element={<Navigate to="/login" replace />} />
  </Routes>
    </Router>
  );
}

export default App;
