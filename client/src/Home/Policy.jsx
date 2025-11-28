import React from "react";
import TopBar from "./TopBar";
import "./home.css";
import Footer from "./Footer";

const Policy = () => {
  return (
    <>
      <TopBar />
      <div className="policy-modern-container">
        <div className="policy-card">
          <h1 className="policy-title review-title-script">Goldust Creation System Policy</h1>
          <p className="policy-intro">
            Welcome to Goldust Creation! Our system is designed to provide a seamless and professional experience for all users, including clients, suppliers, and administrators. Please review our comprehensive policies to ensure a safe, respectful, and efficient environment for everyone:
          </p>
          <ul className="policy-list">
            <li><span className="policy-list-title">Appointment Booking:</span> All appointments must be scheduled in advance through our online system. Users are responsible for ensuring the accuracy of their booking details.</li>
            <li><span className="policy-list-title">Cancellation & Rescheduling:</span> Cancellations or changes to appointments require a minimum of 24-hour notice. Failure to comply may result in forfeiture of deposits or service fees.</li>
            <li><span className="policy-list-title">Attendance & Punctuality:</span> Late arrivals may result in reduced service time or rescheduling at the discretion of the provider. Repeated tardiness may affect future booking privileges.</li>
            <li><span className="policy-list-title">Respectful Conduct:</span> All users are expected to maintain respectful and professional behavior within the system and during all interactions. Harassment, abuse, or inappropriate language will not be tolerated and may result in account suspension or termination.</li>
            <li><span className="policy-list-title">Supplier Standards:</span> Suppliers must adhere to service quality guidelines and respond promptly to client inquiries and bookings. Failure to meet standards may result in removal from the platform.</li>
            <li><span className="policy-list-title">Data Privacy:</span> User information is protected in accordance with our privacy policy. Personal data will not be shared with third parties except as required by law or for service fulfillment.</li>
            <li><span className="policy-list-title">System Security:</span> Unauthorized access, misuse, or attempts to compromise system integrity are strictly prohibited. Violators will be subject to legal action and permanent ban from the platform.</li>
            <li><span className="policy-list-title">Feedback & Support:</span> Users are encouraged to provide constructive feedback and report any issues through our support channels. Our team is committed to resolving concerns promptly and professionally.</li>
            <li><span className="policy-list-title">Policy Updates:</span> Goldust Creation reserves the right to update policies as needed. Users will be notified of significant changes via system announcements or email.</li>
          </ul>
          <p className="policy-footer">
            By using the Goldust Creation system, you agree to abide by these policies. For further details or assistance, please contact our support team.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Policy;
