


import React, { useState, useEffect } from 'react';
import ClientSidebar from './ClientSidebar';
import { Calendar as RsuiteCalendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import './usercalendar.css';

function Modal({ open, onClose, children }) {
	if (!open) return null;
	return (
		<div className="uc-modal-overlay">
			<div className="uc-modal-content">
				<button className="uc-modal-close" onClick={onClose} aria-label="Close">×</button>
				{children}
			</div>
		</div>
	);
}

const UserCalendar = () => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [events, setEvents] = useState([]);
	const [viewEventsModalOpen, setViewEventsModalOpen] = useState(false);
	const [viewEventsDate, setViewEventsDate] = useState(null);
	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [loading, setLoading] = useState(true);

	// Get logged-in user info
	const user = JSON.parse(localStorage.getItem('user') || '{}');
	const userEmail = user.email;
	const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

	useEffect(() => {
		async function fetchEventsAndBookings() {
			try {
				const [schedulesRes, pendingRes, approvedRes, finishedRes] = await Promise.all([
					fetch('/api/schedules'),
					fetch('/api/bookings/pending'),
					fetch('/api/bookings/approved'),
					fetch('/api/bookings/finished'),
				]);
				const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
				const pending = pendingRes.ok ? await pendingRes.json() : [];
				const approved = approvedRes.ok ? await approvedRes.json() : [];
				const finished = finishedRes.ok ? await finishedRes.json() : [];
				// Filter events for this user by name or email
				const filteredSchedules = schedules.filter(ev => {
					if (ev.type === 'Customer' || ev.type === 'Supplier') {
						return (ev.person === userEmail || ev.person === userName);
					}
					return false;
				});
				// Filter bookings for this client
				const allBookings = [...pending, ...approved, ...finished].filter(b => b.email === userEmail || b.name === userName);
				// Map bookings to calendar event format
				const bookingEvents = allBookings.filter(b => b.date).map(b => ({
					_id: b._id,
					title: b.eventType || b.title || 'Booking',
					type: 'Booking',
					person: b.name || b.contact || b.email || '',
					date: typeof b.date === 'string' ? b.date.slice(0, 10) : new Date(b.date).toISOString().slice(0, 10),
					location: b.eventVenue || '',
					description: b.specialRequest || b.details || '',
					status: b.status || '',
				}));
				setEvents([...filteredSchedules, ...bookingEvents]);
			} catch (err) {
				setEvents([]);
			} finally {
				setLoading(false);
			}
		}
		if (userEmail) fetchEventsAndBookings();
	}, [userEmail, userName]);

	// Get events for a specific date (compare as string)
	const getEventsForDate = (date) => {
		let d;
		if (typeof date === 'string') {
			d = date;
		} else {
			d = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
		}
		return events.filter(ev => ev.date === d);
	};

		// Custom render cell for calendar with double-click
		const renderCell = (date) => {
			const dayEvents = getEventsForDate(date);
			if (dayEvents.length === 0) return null;
			const maxToShow = 3;
			return (
				<div
					className="uc-calendar-cell"
					onDoubleClick={e => {
						e.stopPropagation();
						setViewEventsDate(date);
						setViewEventsModalOpen(true);
					}}
					title="Double-click to view events"
				>
					{dayEvents.length > maxToShow
						? ([
								...dayEvents.slice(0, maxToShow).map(ev => (
									<div key={ev._id || ev.id} className="uc-calendar-event">
										{ev.title}
									</div>
								)),
								<div key="plus-sign" className="uc-calendar-event uc-calendar-event-plus">+</div>
							])
						: dayEvents.map(ev => (
								<div key={ev._id || ev.id} className="uc-calendar-event">
									{ev.title}
								</div>
							))}
				</div>
			);
		};

	return (
		<div className="uc-main-layout">
			<ClientSidebar />
			<div className="uc-content">
				<h2 className="uc-title">Calendar</h2>
				<div className="uc-calendar-container">
					{loading ? (
						<div className="uc-loading">Loading...</div>
					) : (
						<div className="uc-calendar-inner">
							<RsuiteCalendar
								value={selectedDate}
								onChange={setSelectedDate}
								bordered
								className="uc-rsuite-calendar"
								renderCell={renderCell}
							/>
						</div>
					)}
				</div>
				{/* Modal for viewing events on a day */}
				<Modal open={viewEventsModalOpen} onClose={() => setViewEventsModalOpen(false)}>
					<h2 className="uc-modal-title">
						Schedule for {viewEventsDate ? (typeof viewEventsDate === 'string' ? viewEventsDate : `${viewEventsDate.getFullYear()}-${String(viewEventsDate.getMonth()+1).padStart(2,'0')}-${String(viewEventsDate.getDate()).padStart(2,'0')}`) : ''}
					</h2>
					<div className="uc-modal-schedule-list">
						{viewEventsDate && getEventsForDate(viewEventsDate).length > 0 ? (
							getEventsForDate(viewEventsDate).map(ev => (
								<div key={ev._id || ev.id} className="uc-modal-schedule-card">
									<div
										className="uc-modal-schedule-card-main"
										onClick={() => {
											setSelectedEvent(ev);
											setEventDetailsModalOpen(true);
										}}
										title="Click to view details"
									>
										<div className="uc-modal-schedule-title">{ev.title}</div>
										<div className="uc-modal-schedule-type">{ev.type}: <span>{ev.person}</span></div>
										<div className="uc-modal-schedule-location">{ev.location}</div>
									</div>
								</div>
							))
						) : (
							<div className="uc-modal-no-schedule">No schedule for this day.</div>
						)}
					</div>
					{/* Modal for event details */}
					<Modal open={eventDetailsModalOpen} onClose={() => setEventDetailsModalOpen(false)}>
						{selectedEvent && (
							<div className="uc-modal-details">
								<div className="uc-modal-details-accent" />
								<div className="uc-modal-details-main">
									<h2 className="uc-modal-details-title">{selectedEvent.title}</h2>
									<div className="uc-modal-details-row"><span>Type:</span> <span>{selectedEvent.type}</span></div>
									<div className="uc-modal-details-row"><span>{selectedEvent.type} Name:</span> <span>{selectedEvent.person}</span></div>
									<div className="uc-modal-details-row"><span>Date:</span> <span>{selectedEvent.date}</span></div>
									<div className="uc-modal-details-row"><span>Location:</span> <span>{selectedEvent.location}</span></div>
									<div className="uc-modal-details-row"><span>Description:</span> <span>{selectedEvent.description}</span></div>
								</div>
							</div>
						)}
					</Modal>
				</Modal>
			</div>
		</div>
	);
};

export default UserCalendar;
