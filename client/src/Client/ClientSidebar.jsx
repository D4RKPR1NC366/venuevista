import React, { useState } from 'react';
import './client-sidebar.css';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Profile ', icon: <PersonIcon />, to: '/client/personal-information' },
  { label: 'Booking ', icon: <InfoIcon />, to: '/client/booking-information' },
  { label: 'Calendar', icon: <InfoIcon />, to: '/client/calendar' },
  { label: 'Notification', icon: <NotificationsIcon />, to: '/client/notification' },
  { label: 'Home', icon: <HomeIcon />, to: '/client/home' },
  { label: 'Log out', icon: <LogoutIcon />, onClick: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  }},
];

const ClientSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <aside className={`client-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="client-sidebar-header">
        <div className="client-sidebar-title">Venuevista</div>
        <button 
          className="sidebar-toggle-mobile" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <nav className={`client-sidebar-nav ${isOpen ? 'nav-visible' : 'nav-hidden'}`}>
        <ul>
        {navLinks.filter(link => link.label !== 'Log out').map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <li key={link.label} className={isActive ? 'active' : ''}>
              <Link to={link.to} onClick={() => setIsOpen(false)}>
                <span className="sidebar-icon">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
        </ul>
      </nav>
      <button 
        className={`client-logout-btn ${isOpen ? 'logout-visible' : 'logout-hidden'}`} 
        onClick={() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          window.location.href = '/login';
        }}
      >
        <span className="sidebar-icon"><LogoutIcon fontSize="small" /></span>
        <span>Log Out</span>
      </button>
    </aside>
  );
};

export default ClientSidebar;
