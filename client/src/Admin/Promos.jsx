import React, { useRef, useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Promos() {
	return (
		<div className="admin-promos-container" style={{ display: 'flex', minHeight: '100vh' }}>
			<Sidebar />
			<div className="promos-content" style={{ flex: 1, padding: '2rem' }}>
				<h1>Promotions</h1>
				<p>Manage your current promotions here.</p>
				{/* Add promo management UI here */}
			</div>
		</div>
	);
}