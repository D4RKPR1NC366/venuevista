import React, { useState } from 'react';
import './client-sidebar.css';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Profile ', icon: <PersonIcon />, to: '/client/personal-information' },
  { label: 'Booking ', icon: <InfoIcon />, to: '/client/booking-information' },
  { label: 'Calendar', icon: <InfoIcon />, to: '/client/calendar' }, // Calendar link for both users
  { label: 'Notification', icon: <NotificationsIcon />, to: '/client/notification' },
  { label: 'Home', icon: <HomeIcon />, to: '/client/home' },
  { label: 'Log out', icon: <LogoutIcon />, to: '/logout' },
];

const ClientSidebar = () => {
  const location = useLocation();
  return (
    <div className="client-sidebar">
      <div className="client-sidebar-header">
        <h2 className="profile-title">Goldust Creations</h2>
      </div>
      <ul>
        {/* Render all links except Home and Log out */}
        {navLinks.filter(link => link.label !== 'Home' && link.label !== 'Log out').map((link) => {
          const isActive = location.pathname === link.to;
          // Add extra space below Notification link
          const extraStyle = link.label === 'Notification' ? { marginBottom: '32px' } : {};
          return (
            <li key={link.label} className={isActive ? 'active' : ''} style={extraStyle}>
              <span className="icon">{link.icon}</span>
              <Link to={link.to} style={{ textDecoration: 'none', color: 'inherit' }}>{link.label}</Link>
            </li>
          );
        })}
        {/* Home link above Log out */}
        {(() => {
          const homeLink = navLinks.find(link => link.label === 'Home');
          const isActive = location.pathname === homeLink.to;
          return (
            <li key={homeLink.label} className={isActive ? 'active' : ''}>
              <span className="icon">{homeLink.icon}</span>
              <Link to={homeLink.to} style={{ textDecoration: 'none', color: 'inherit' }}>{homeLink.label}</Link>
            </li>
          );
        })()}
        {/* Log out link at the bottom */}
        {(() => {
          const logoutLink = navLinks.find(link => link.label === 'Log out');
          const isActive = location.pathname === logoutLink.to;
          return (
            <li key={logoutLink.label} className={isActive ? 'active' : ''}>
              <span className="icon">{logoutLink.icon}</span>
              <Link to={logoutLink.to} style={{ textDecoration: 'none', color: 'inherit' }}>{logoutLink.label}</Link>
            </li>
          );
        })()}
      </ul>
    </div>
  );
};

export default ClientSidebar;
