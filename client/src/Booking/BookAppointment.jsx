import React from "react";
import TopBar from '../Home/TopBar';
import { useNavigate } from "react-router-dom";
import "./booking.css";

const BookAppointment = () => {
  const navigate = useNavigate();
  return (
    <div className="booking-root" style={{ minHeight: '100vh', background: '#fff', color: '#111', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingTop: '80px',
        paddingBottom: '40px'
      }}>
        <div style={{ maxWidth: 700, padding: '24px', textAlign: 'center', color: '#111' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 32, color: '#000', fontSize: '1.75rem', lineHeight: '1.5' }}>
            Your booking is being reviewed by our team. We'll notify your account and email as soon as we've reviewed it! Thank you.
          </h2>
         
          <button
            className="booking-btn"
            style={{ background: '#ff9800', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, minWidth: 180, marginTop: 16, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
