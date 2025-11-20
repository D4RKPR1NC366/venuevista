
import React, { useRef, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './promos.css';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export default function Promos() {
	const [form, setForm] = useState({
		eventType: '',
		discount: '',
		description: '',
		startDate: '',
		endDate: ''
	});
	const [showForm, setShowForm] = useState(false);

	const eventTypes = [
		'Wedding',
		'Debut',
		'Seminar',
		'Birthday',
		'Corporate',
		'Other'
	];

	 const handleChange = (e) => {
		 const { name, value } = e.target;
		 setForm((prev) => ({ ...prev, [name]: value }));
	 };

	 const handleDateChange = (name, value) => {
		 setForm((prev) => ({ ...prev, [name]: value ? dayjs(value).format('YYYY-MM-DD') : '' }));
	 };

	const handleSubmit = (e) => {
		e.preventDefault();
		// Here you would send the form data to your backend or handle it as needed
		alert('Promotion created!');
		setForm({ eventType: '', discount: '', description: '', startDate: '', endDate: '' });
		setShowForm(false);
	};

	const handleAddPromoClick = () => {
		setShowForm(true);
	};

	 return (
		 <div className="admin-promos-container">
			 <Sidebar />
			 <div className="promos-content">
				 <div className="promos-header">
					 <h1>Promotions</h1>
					 {!showForm && (
						 <button className="add-promo-btn" onClick={handleAddPromoClick}>
							 Add Promo
						 </button>
					 )}
				 </div>
				 <p>Manage your current promotions here.</p>
				 {showForm && (
					 <div className="promo-modal-overlay">
						 <form className="promo-modal-container promo-form" onSubmit={handleSubmit}>
							 <div className="promo-modal-header">
								 <span className="promo-modal-title">Add Promo</span>
								 <button className="promo-modal-close" type="button" onClick={() => setShowForm(false)}>&times;</button>
							 </div>
							 <label>
								 Event Type
								 <select name="eventType" value={form.eventType} onChange={handleChange} required>
									 <option value="">Select event</option>
									 {eventTypes.map(type => (
										 <option key={type} value={type}>{type}</option>
									 ))}
								 </select>
							 </label>
							 <label>
								 Discount (%)
								 <input type="number" name="discount" value={form.discount} onChange={handleChange} min="0" max="100" required />
							 </label>
							 <label>
								 Description
								 <textarea name="description" value={form.description} onChange={handleChange} required />
							 </label>
							 <LocalizationProvider dateAdapter={AdapterDayjs}>
								 <label>
									 Start Date
									 <DatePicker
										 value={form.startDate ? dayjs(form.startDate) : null}
										 onChange={value => handleDateChange('startDate', value)}
										 disableOpenPicker={false}
										 slotProps={{ textField: { fullWidth: true, required: true, inputProps: { readOnly: true } } }}
									 />
								 </label>
								 <label>
									 End Date
									 <DatePicker
										 value={form.endDate ? dayjs(form.endDate) : null}
										 onChange={value => handleDateChange('endDate', value)}
										 disableOpenPicker={false}
										 slotProps={{ textField: { fullWidth: true, required: true, inputProps: { readOnly: true } } }}
									 />
								 </label>
							 </LocalizationProvider>
							 <button type="submit">
								 Create Promotion
							 </button>
						 </form>
					 </div>
				 )}
			 </div>
		 </div>
	 );
}