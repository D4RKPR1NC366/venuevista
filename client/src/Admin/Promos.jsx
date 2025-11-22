

import React, { useRef, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './promos.css';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import api from '../services/api';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';


export default function Promos() {
	const [form, setForm] = useState({
		title: '',
		discount: '',
		description: '',
		startDate: '',
		endDate: ''
	});
	const [showForm, setShowForm] = useState(false);
	const [editingPromoId, setEditingPromoId] = useState(null);
	const [promos, setPromos] = useState([]);


	useEffect(() => {
		fetchPromos();
	}, []);

	const fetchPromos = async () => {
		try {
			const res = await api.get('/promos');
			setPromos(res.data);
		} catch (err) {
			// Optionally handle error
		}
	};

		// Delete promo handler
		const handleDeletePromo = async (promoId) => {
			if (!window.confirm('Are you sure you want to delete this promotion?')) return;
			try {
				await api.delete(`/promos/${promoId}`);
				setPromos((prev) => prev.filter((p) => p._id !== promoId));
			} catch (err) {
				alert('Failed to delete promotion.');
			}
		};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleDateChange = (name, value) => {
		setForm((prev) => ({ ...prev, [name]: value ? dayjs(value).format('YYYY-MM-DD') : '' }));
	};

		const handleSubmit = async (e) => {
			e.preventDefault();
			try {
				const promoPayload = {
					title: form.title,
					description: form.description,
					discountType: 'percentage',
					discountValue: Number(form.discount),
					validFrom: form.startDate,
					validUntil: form.endDate,
				};
				if (editingPromoId) {
					await api.put(`/promos/${editingPromoId}`, promoPayload);
					alert('Promotion updated!');
				} else {
					await api.post('/promos', promoPayload);
					alert('Promotion created!');
				}
				setForm({ title: '', discount: '', description: '', startDate: '', endDate: '' });
				setShowForm(false);
				setEditingPromoId(null);
				fetchPromos();
			} catch (error) {
				alert('Failed to save promotion.');
			}
		};

		const handleAddPromoClick = () => {
			setForm({ title: '', discount: '', description: '', startDate: '', endDate: '' });
			setEditingPromoId(null);
			setShowForm(true);
		};

		const handleEditPromo = (promo) => {
			setForm({
				title: promo.title || '',
				discount: promo.discountValue?.toString() || '',
				description: promo.description || '',
				startDate: promo.validFrom ? dayjs(promo.validFrom).format('YYYY-MM-DD') : '',
				endDate: promo.validUntil ? dayjs(promo.validUntil).format('YYYY-MM-DD') : '',
			});
			setEditingPromoId(promo._id);
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
				{/* Removed: <p>Manage your current promotions here.</p> */}
							{showForm && (
								<div className="promo-modal-overlay">
									<form className="promo-modal-container promo-form" onSubmit={handleSubmit}>
										<div className="promo-modal-header">
											<span className="promo-modal-title">{editingPromoId ? 'Edit Promo' : 'Add Promo'}</span>
											<button className="promo-modal-close" type="button" onClick={() => { setShowForm(false); setEditingPromoId(null); }}>&times;</button>
										</div>
										<label>
											Promo Title
											<input
												type="text"
												name="title"
												value={form.title}
												onChange={handleChange}
												placeholder="Enter promo title"
												required
											/>
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
											{editingPromoId ? 'Update Promotion' : 'Create Promotion'}
										</button>
									</form>
								</div>
							)}

			{/* Promo Cards List */}
			<div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '2rem' }}>
				   {promos.map((promo) => (
					   <div
						   key={promo._id}
						   className="promo-card"
					   >
						{/* Edit Icon */}
						<button
							style={{
								position: 'absolute',
								top: '10px',
								right: '40px',
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
								color: '#fff',
								padding: 0,
							}}
							title="Edit Promo"
							onClick={() => handleEditPromo(promo)}
						>
							<EditIcon />
						</button>
						{/* Delete Icon */}
						<button
							style={{
								position: 'absolute',
								top: '10px',
								right: '10px',
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
								color: '#fff',
								padding: 0,
							}}
							title="Delete Promo"
							onClick={() => handleDeletePromo(promo._id)}
						>
							<DeleteIcon />
						</button>
						<div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.3rem' }}>{promo.title}</div>
						<div style={{ fontWeight: 500, color: '#fff' }}>{promo.discountValue}% OFF</div>
						<div style={{ fontSize: '0.98rem', marginBottom: '0.5rem' }}>{promo.description}</div>
						<div style={{ fontSize: '0.9rem', color: '#555' }}>
							{promo.validFrom ? `From: ${promo.validFrom.slice(0, 10)}` : ''}<br />
							{promo.validUntil ? `To: ${promo.validUntil.slice(0, 10)}` : ''}
						</div>
					</div>
				))}
			</div>
			</div>
		</div>
	);
}