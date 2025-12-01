const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
        pass: process.env.EMAIL_PASS || 'epvs rstu cjvq wohu'
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <h1>Password Reset Verification Code</h1>
                <p>Your verification code is: <strong>${otp}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>For your security, never share this code with anyone.</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendSupplierPendingEmail = async (email, firstName, lastName, companyName) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
            to: email,
            subject: 'Supplier Registration - Pending Admin Approval',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">VenueVista by Goldust Creations</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9fafb;">
                        <h2 style="color: #1f2937;">Registration Submitted Successfully!</h2>
                        <p>Dear ${firstName} ${lastName},</p>
                        <p>Thank you for registering your supplier account for <strong>${companyName}</strong>.</p>
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>⏳ Status: Pending Admin Approval</strong></p>
                            <p style="margin: 10px 0 0 0;">Your account is currently under review by our admin team. You will receive another email once your account has been approved.</p>
                        </div>
                        <p><strong>What happens next?</strong></p>
                        <ul style="line-height: 1.8;">
                            <li>Our admin team will review your registration</li>
                            <li>You'll receive an email notification once approved</li>
                            <li>After approval, you can log in and start using our services</li>
                        </ul>
                        <p>If you have any questions, please contact us at <a href="mailto:truegoldustcreation@gmail.com">truegoldustcreation@gmail.com</a></p>
                        <p style="margin-top: 30px;">Best regards,<br><strong>VenueVista Team</strong></p>
                    </div>
                    <div style="background-color: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© 2025 Goldust Creations. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendSupplierApprovedEmail = async (email, firstName, lastName, companyName) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
            to: email,
            subject: '✅ Supplier Account Approved - Welcome to VenueVista!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #10b981; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🎉 Account Approved!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9fafb;">
                        <h2 style="color: #1f2937;">Welcome to VenueVista!</h2>
                        <p>Dear ${firstName} ${lastName},</p>
                        <p>Great news! Your supplier account for <strong>${companyName}</strong> has been approved by our admin team.</p>
                        <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>✅ Status: Account Approved</strong></p>
                            <p style="margin: 10px 0 0 0;">You can now log in and access all supplier features!</p>
                        </div>
                        <p><strong>What you can do now:</strong></p>
                        <ul style="line-height: 1.8;">
                            <li>Log in to your supplier account</li>
                            <li>Manage your schedules and appointments</li>
                            <li>View and respond to booking requests</li>
                            <li>Update your business information</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/login" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Log In Now</a>
                        </div>
                        <p>If you have any questions, please contact us at <a href="mailto:truegoldustcreation@gmail.com">truegoldustcreation@gmail.com</a></p>
                        <p style="margin-top: 30px;">Best regards,<br><strong>VenueVista Team</strong></p>
                    </div>
                    <div style="background-color: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© 2025 Goldust Creations. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendSupplierRejectedEmail = async (email, firstName, lastName, companyName) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
            to: email,
            subject: 'Supplier Registration Status Update',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">VenueVista by Goldust Creations</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9fafb;">
                        <h2 style="color: #1f2937;">Registration Status Update</h2>
                        <p>Dear ${firstName} ${lastName},</p>
                        <p>Thank you for your interest in becoming a supplier for VenueVista.</p>
                        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Registration Status</strong></p>
                            <p style="margin: 10px 0 0 0;">Unfortunately, we are unable to approve your supplier account for <strong>${companyName}</strong> at this time.</p>
                        </div>
                        <p>This decision may be due to various factors such as:</p>
                        <ul style="line-height: 1.8;">
                            <li>Incomplete or incorrect information provided</li>
                            <li>Business requirements not meeting our criteria</li>
                            <li>Duplicate registration</li>
                        </ul>
                        <p>If you believe this was a mistake or would like to reapply, please contact us at <a href="mailto:truegoldustcreation@gmail.com">truegoldustcreation@gmail.com</a></p>
                        <p style="margin-top: 30px;">Best regards,<br><strong>VenueVista Team</strong></p>
                    </div>
                    <div style="background-color: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© 2025 Goldust Creations. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

module.exports = {
    sendOTP,
    sendSupplierPendingEmail,
    sendSupplierApprovedEmail,
    sendSupplierRejectedEmail,
    transporter
};
