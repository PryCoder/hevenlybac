const nodemailer = require('nodemailer');
const logger = require('../logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  pool: {
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 500,
    rateLimit: 5,
  },
});

// Verify connection on startup
transporter.verify((err, success) => {
  if (err) {
    logger.error(`Email config error: ${err.message}`);
  } else {
    logger.info('Email service ready');
  }
});

const sendAdminNotification = async (data) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border: 1px solid #F2E8E6;">
      <h2 style="color: #C9A7A0; font-weight: 400; border-bottom: 1px solid #F2E8E6; padding-bottom: 12px;">New Inquiry</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px; color:#6F6F6F;">
        <tr style="border-bottom:1px solid #F2E8E6;"><td style="padding:8px; font-weight:600; width:120px; color:#C9A7A0;">Name</td><td style="padding:8px;">${data.name}</td></tr>
        <tr style="border-bottom:1px solid #F2E8E6;"><td style="padding:8px; font-weight:600; color:#C9A7A0;">Email</td><td style="padding:8px;">${data.email}</td></tr>
        <tr style="border-bottom:1px solid #F2E8E6;"><td style="padding:8px; font-weight:600; color:#C9A7A0;">Event</td><td style="padding:8px;">${data.eventType}</td></tr>
        <tr style="border-bottom:1px solid #F2E8E6;"><td style="padding:8px; font-weight:600; color:#C9A7A0;">Budget</td><td style="padding:8px;">${data.budget}</td></tr>
      </table>
      <div style="margin-top:16px; padding:12px; background:#F9F5F4; border-left:3px solid #C9A7A0;">
        <p style="margin:0;"><strong>Message:</strong></p>
        <p style="margin:8px 0 0 0; white-space:pre-wrap; word-break:break-word;">${data.message.substring(0, 500)}</p>
      </div>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"HeavenlyWeds" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `New: ${data.name} - ${data.eventType}`,
      html,
      priority: 'normal',
    });
    logger.info(`Admin email sent: ${data.email}`);
  } catch (err) {
    logger.error(`Admin email failed: ${err.message}`);
    // Don't throw - let form submit succeed even if email fails
  }
};

const sendClientConfirmation = async (data) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border: 1px solid #F2E8E6;">
      <h2 style="color: #C9A7A0; font-weight: 400;">Dear ${data.name},</h2>
      <p style="color:#6F6F6F; font-size:14px; line-height:1.6;">
        Thank you for contacting HeavenlyWeds. We received your inquiry and will respond within <strong>24 hours</strong>.
      </p>
      <p style="color:#C9A7A0; font-size:14px; margin-top:20px;">Best regards,<br/><strong>HeavenlyWeds Team</strong></p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"HeavenlyWeds" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'We received your inquiry',
      html,
      priority: 'normal',
    });
    logger.info(`Client email sent: ${data.email}`);
  } catch (err) {
    logger.error(`Client email failed: ${err.message}`);
  }
};

module.exports = { sendAdminNotification, sendClientConfirmation };
