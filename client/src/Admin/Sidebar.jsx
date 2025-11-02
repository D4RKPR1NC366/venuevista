
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.css';
// MUI icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AlarmIcon from '@mui/icons-material/Alarm';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroupIcon from '@mui/icons-material/Group';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';


const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Bookings', path: '/admin/booking', icon: <BookOnlineIcon fontSize="small" /> },
  { label: 'Products & Services', path: '/admin/products-services', icon: <StorefrontIcon fontSize="small" /> },
  { label: 'Reminders', path: '/admin/reminders', icon: <AlarmIcon fontSize="small" /> },
  { label: 'Calendar', path: '/admin/calendars', icon: <CalendarMonthIcon fontSize="small" /> },
  { label: 'Suppliers', path: '/admin/suppliers', icon: <LocalShippingIcon fontSize="small" /> },
  { label: 'Users / Clients', path: '/admin/user-clients', icon: <GroupIcon fontSize="small" /> },
  { label: 'Background Gallery', path: '/admin/background-gallery', icon: <PhotoLibraryIcon fontSize="small" /> },
  { label: 'Supplier Schedules', path: '/admin/supplier-schedules', icon: <AlarmIcon fontSize="small" /> },
  { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
];

export default function Sidebar() {
  const location = useLocation();
  const handleLogout = () => {
    // Clear any authentication tokens here if needed
    window.location.href = '/login';
  };
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">GOLDUST CREATION</div>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path} className="sidebar-link">
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <button className="admin-logout-btn" onClick={handleLogout}>
        <span className="sidebar-icon"><LogoutIcon fontSize="small" /></span>
        <span>Log Out</span>
      </button>
    </aside>
  );
}
