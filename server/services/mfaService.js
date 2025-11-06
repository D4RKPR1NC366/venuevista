const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure email transporter (reusing existing email service configuration)
const { transporter } = require('./emailService');

// Generate a random 6-digit code
function generateMFACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store MFA codes with expiration (5 minutes)
const mfaCodes = new Map();

// Debug function to check stored codes
function getStoredCode(email) {
    const data = mfaCodes.get(email);
    if (!data) return 'No code stored';
    return {
        code: data.code,
        expiresIn: Math.round((data.expiry - Date.now()) / 1000) + ' seconds'
    };
}

// Generate and send MFA code
async function sendMFACode(email) {
    if (!email) {
        throw new Error('Email is required to send MFA code');
    }

    const code = generateMFACode();
    console.log('Generated MFA code for:', email, 'Code:', code);
    
    // Store code with expiration
    mfaCodes.set(email, {
        code,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log('Stored code info:', getStoredCode(email));

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER || 'truegoldustcreation@gmail.com',
        to: email,
        subject: 'Your MFA Code - Goldust Creation',
        html: `
            <h2>Your Authentication Code</h2>
            <p>Please use the following code to complete your login:</p>
            <h1 style="color: #F7C04A; font-size: 32px; letter-spacing: 3px;">${code}</h1>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        `
    };

    try {
        // Send email
        await transporter.sendMail(mailOptions);
        console.log('MFA code sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Failed to send MFA code:', error);
        throw new Error('Failed to send verification code: ' + error.message);
    }
}

// Verify MFA code
function verifyMFACode(email, code) {
    console.log('Verifying code for:', email);
    console.log('Received code:', code);
    console.log('Stored data:', getStoredCode(email));
    
    const storedData = mfaCodes.get(email);
    
    if (!storedData) {
        console.log('No stored code found for:', email);
        return false;
    }

    if (Date.now() > storedData.expiry) {
        console.log('Code expired for:', email);
        mfaCodes.delete(email);
        return false;
    }

    if (storedData.code !== code) {
        console.log('Code mismatch. Expected:', storedData.code, 'Received:', code);
        return false;
    }

    // Code is valid - clean up
    console.log('Code verified successfully for:', email);
    mfaCodes.delete(email);
    return true;
}

module.exports = {
    sendMFACode,
    verifyMFACode
};