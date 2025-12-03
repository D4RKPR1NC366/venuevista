
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from '../Home/TopBar';
import dayjs from 'dayjs';
import { formatPHTime } from '../utils/date';
import "./booking.css";

const BookSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking || {};
  // Get user details from localStorage (adjust key if needed)
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user')) || {};
  } catch (e) {
    user = {};
  }
  // Use booking data if present, else fallback to user data
  // Build full name from user details if available
  let fullName = '';
  if (user?.firstName) {
    fullName = user.firstName;
    if (user.middleName) fullName += ' ' + user.middleName;
    if (user.lastName) fullName += ' ' + user.lastName;
  } else if (user?.fullName) {
    fullName = user.fullName;
  } else if (user?.name) {
    fullName = user.name;
  }
  const displayName = booking?.name || fullName || '';
  const displayContact = booking?.contact || user?.contact || user?.phone || '';
  const displayEmail = booking?.email || user?.email || '';
  // Calculate subtotal and total
  const subtotal = (booking?.products || []).reduce((sum, item) => {
    const base = Number(item.price) || 0;
    const adds = Array.isArray(item.__cart_additionals) ? item.__cart_additionals.reduce((a, add) => a + (Number(add.price) || 0), 0) : 0;
    return sum + base + adds;
  }, 0);
  const promoDiscount = booking?.promoDiscount ? Number(booking.promoDiscount) : 0;
  const totalWithPromo = subtotal - (subtotal * (promoDiscount / 100));

  return (
    <div className="booking-root">
      <TopBar />
      <div className="booking-header">
        <h2>BOOKING SUMMARY</h2>
      </div>
      <div className="booking-summary-container" style={{ boxShadow: 'none' }}>
        <div>
          <div className="booking-summary-row">
            <div className="booking-summary-col">
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Name :</span> <span style={{ color: '#111' }}>{displayName}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Contact Number :</span> <span style={{ color: '#111' }}>{displayContact}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Email Address :</span> <span style={{ color: '#111' }}>{displayEmail}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Event Type :</span> <span style={{ color: '#111' }}>{booking?.eventType || ""}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Event Date :</span> <span style={{ color: '#111' }}>{booking?.date ? (() => {
                try {
                  if (typeof booking.date === 'string') return booking.date;
                  if (booking.date?.$d) return formatPHTime(booking.date.$d, 'MM/DD/YYYY');
                  return formatPHTime(booking.date, 'MM/DD/YYYY');
                } catch (e) {
                  return booking.date.toString();
                }
              })() : ""}</span></div>
              {/* Event Location removed as per request */}
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Event Venue :</span> <span style={{ color: '#111' }}>{booking?.eventVenue || ""}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Appointment Method :</span> <span style={{ color: '#111' }}>{booking?.outsidePH === 'yes' ? 'Face to Face' : booking?.outsidePH === 'no' ? 'Virtual/Online' : 'Not specified'}</span></div>
            </div>
            <div className="booking-summary-col">
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Guest Count :</span> <span style={{ color: '#111' }}>{booking?.guestCount || ""}</span></div>
              <div style={{ marginBottom: 12, color: '#111' }}><span style={{ fontWeight: 'bold' }}>Subtotal:</span> <span style={{ color: '#111' }}>PHP {subtotal}</span></div>
              {booking?.promoTitle && (
                <div style={{ marginBottom: 12, color: '#388e3c', fontWeight: 'bold' }}>
                  Promo Applied: {booking.promoTitle}
                </div>
              )}
             
            </div>
          </div>
          {/* Services and Products Availed */}
          <div style={{ marginTop: 32, marginBottom: 0 }}>
            <div style={{ marginBottom: 12, color: '#111', fontWeight: 'bold'}}>Services and Products Availed:</div>
            {booking?.products && booking.products.length > 0 ? (
              <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {booking.products.map((item, idx) => (
                  <div key={idx} style={{
                    background: '#fafafa',
                    border: '1px solid #eee',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16
                  }}>
                    {item.image && (
                      <img src={item.images?.[0] || item.image} alt={item.title} style={{ width: 60, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      {item.price && <div style={{ color: '#888', fontWeight: 500 }}>PHP {item.price}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#888', marginBottom: 16 }}>No products/services selected.</div>
            )}
          </div>
          {/* Special Request full width */}
          <div style={{ marginTop: 24, marginBottom: 0 }}>
            <div style={{ marginBottom: 12, color: '#111', fontWeight: 'bold'}}>Special Request :</div>
            <textarea
              className="booking-special-request"
              style={{ width: "100%", minHeight: 140, fontFamily: "inherit",  padding: 12, borderRadius: 8, border: "2px solid #222", resize: "vertical", background: '#fff', color: '#111' }}
              value={booking?.specialRequest || ""}
              readOnly
            />
          </div>
          {/* Selected Additionals */}
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12, color: '#111', fontWeight: 'bold'}}>Selected Additionals:</div>
            {booking?.products && booking.products.length > 0 ? (
              (() => {
                // Gather additionals from booking.products. They may be stored as __cart_additionals or as product.additionals
                const allAdds = [];
                booking.products.forEach((p, i) => {
                  const adds = p.__cart_additionals || p.additionals || [];
                  if (Array.isArray(adds)) adds.forEach(a => allAdds.push(a));
                });
                if (allAdds.length === 0) return <div style={{ color: '#888' }}>No additionals selected.</div>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {allAdds.map((add, idx) => (
                      <div key={add._id || add.title || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#fafafa', borderRadius: 6, border: '1px solid #eee' }}>
                        <div style={{ fontWeight: 600 }}>{add.title}</div>
                        <div style={{ color: '#888' }}>PHP {add.price ? add.price : 0}</div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div style={{ color: '#888' }}>No additionals selected.</div>
            )}
          </div>
          <div className="booking-summary-btn-row">
            <button
              type="button"
              className="booking-btn booking-btn-orange"
              style={{ minWidth: 100, background: '#ff9800', color: '#fff', border: 'none' }}
              onClick={() => navigate('/booking')}
            >
              Back
            </button>
            <button
              type="button"
              className="booking-btn booking-btn-next booking-btn-orange"
              style={{ minWidth: 100, background: '#ff9800', color: '#fff', border: 'none' }}
              onClick={async () => {
                // Send booking to pending bookings
                try {
                  // Convert date to ISO string if needed
                  // Use user details if booking fields are missing
                  let fullName = '';
                  if (user?.firstName) {
                    fullName = user.firstName;
                    if (user.middleName) fullName += ' ' + user.middleName;
                    if (user.lastName) fullName += ' ' + user.lastName;
                  } else if (user?.fullName) {
                    fullName = user.fullName;
                  } else if (user?.name) {
                    fullName = user.name;
                  }
                  // Ensure each product includes its additionals when sending to backend
                  const productsWithAdd = (booking.products || []).map(p => ({
                    ...p,
                    additionals: p.__cart_additionals || p.additionals || []
                  }));
                  const bookingToSend = {
                    name: booking.name || fullName || '',
                    contact: booking.contact || user?.contact || user?.phone || '',
                    email: booking.email || user?.email || '',
                    eventType: booking.eventType || '',
                    date: booking.date
                      ? (() => {
                          try {
                            if (typeof booking.date === 'string') return booking.date;
                            if (booking.date?.$d) return formatPHTime(booking.date.$d, 'YYYY-MM-DD');
                            return formatPHTime(booking.date, 'YYYY-MM-DD');
                          } catch (e) {
                            return '';
                          }
                        })()
                      : '',
                    eventVenue: booking.eventVenue || '',
                    guestCount: booking.guestCount || 0,
                    subTotal: subtotal,
                    promoTitle: booking.promoTitle || '',
                    promoId: booking.promoId || '',
                    discountType: promoDiscount ? promoDiscount.toString() : '',
                    discount: promoDiscount ? Math.round(subtotal * (promoDiscount / 100)) : 0,
                    totalPrice: Math.round(totalWithPromo),
                    products: productsWithAdd,
                    specialRequest: booking.specialRequest || '',
                    outsidePH: booking.outsidePH || '',
                  };
                  await fetch('/api/bookings/pending', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingToSend)
                  });
                  navigate('/book-appointment');
                } catch (err) {
                  alert('Failed to submit booking. Please try again.');
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSummary;
