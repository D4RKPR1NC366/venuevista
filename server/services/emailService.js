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

module.exports = {
    sendOTP,
    sendPasswordResetEmail
};
