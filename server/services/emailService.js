const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Email Service
 * Handles sending emails using Brevo (Sendinblue) API
 */

// 1) Configure Brevo Client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send Transactional Email
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = options.subject;
        sendSmtpEmail.htmlContent = options.html;
        sendSmtpEmail.sender = { 
            name: "AcadHub", 
            email: process.env.EMAIL_FROM || "no-reply@acadhub.com" 
        };
        sendSmtpEmail.to = [{ email: options.email }];
        sendSmtpEmail.textContent = options.message;

        const result = await emailApi.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully via Brevo:', result.messageId);
        return result;
    } catch (error) {
        console.error('Brevo Email Error:', error);
        throw error;
    }
};

/**
 * Send Verification OTP Email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 */
const sendVerificationEmail = async (email, name, otp) => {
    const subject = 'AcadHub - Email Verification OTP';
    const message = `Your verification code is ${otp}. It will expire in 10 minutes.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0984e3; margin: 0;">AcadHub</h1>
                <p style="color: #636e72; font-size: 14px;">Smart Academic Resource Sharing Platform</p>
            </div>
            <h2 style="color: #2d3436; text-align: center;">Verify Your Email 📧</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for joining AcadHub! To complete your registration and start accessing resources, please use the following One-Time Password (OTP):</p>
            <div style="background-color: #f0f4f8; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px dashed #0984e3;">
                <h1 style="letter-spacing: 8px; color: #0984e3; margin: 0; font-size: 36px;">${otp}</h1>
            </div>
            <p style="color: #636e72; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 12px; color: #b2bec3; text-align: center;">&copy; 2024 AcadHub. All rights reserved.</p>
        </div>
    `;

    await sendEmail({
        email,
        subject,
        message,
        html
    });
};

module.exports = { sendEmail, sendVerificationEmail };
