const nodemailer = require('nodemailer');
const logger = require('../logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendAdminNotification = async (data) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #F2E8E6;">
      <h2 style="color: #C9A7A0; font-weight: 400; border-bottom: 1px solid #F2E8E6; padding-bottom: 16px;">
        ✨ New Inquiry — HeavenlyWeds
      </h2>
      <table style="width:100%; border-collapse:collapse; font-size:15px; color:#6F6F6F;">
        ${rows([
          ['Name',       data.name],
          ['Email',      data.email],
          ['Phone',      data.phone || '—'],
          ['Event Date', data.date || '—'],
          ['Event Type', data.eventType],
          ['Location',   data.location || '—'],
          ['Guests',     data.guests || '—'],
          ['Budget',     data.budget],
        ])}
      </table>
      <div style="margin-top:20px; padding:16px; background:#F9F5F4; border-left:3px solid #C9A7A0;">
        <p style="color:#6F6F6F; font-size:15px; margin:0;"><strong>Message:</strong></p>
        <p style="color:#6F6F6F; font-size:15px; white-space:pre-wrap;">${data.message}</p>
      </div>
      <p style="color:#9A9A9A; font-size:12px; margin-top:24px;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</p>
    </div>`;

  await transporter.sendMail({
    from: `"HeavenlyWeds Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `✨ New Inquiry from ${data.name} — ${data.eventType}`,
    html,
  });
  logger.info(`Admin notification email sent for inquiry from ${data.email}`);
};

const sendClientConfirmation = async (data) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #F2E8E6;">
      <h2 style="color: #C9A7A0; font-weight: 400;">Dear ${data.name},</h2>
      <p style="color:#6F6F6F; font-size:15px; line-height:1.8;">
        Thank you for reaching out to HeavenlyWeds. We have received your inquiry and our team will be in touch within <strong>24 hours</strong> to schedule your complimentary consultation.
      </p>
      <p style="color:#6F6F6F; font-size:15px; line-height:1.8;">
        We look forward to being part of your extraordinary celebration.
      </p>
      <p style="color:#C9A7A0; font-size:15px; margin-top:32px;">Warm regards,<br/><strong>The HeavenlyWeds Team</strong></p>
      <p style="color:#9A9A9A; font-size:12px; margin-top:24px; border-top:1px solid #F2E8E6; padding-top:16px;">
        hello@heavenlyweds.com | +1 (555) 123-4567
      </p>
    </div>`;

  await transporter.sendMail({
    from: `"HeavenlyWeds" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: 'We received your inquiry — HeavenlyWeds',
    html,
  });
  logger.info(`Confirmation email sent to client ${data.email}`);
};

// helper
const rows = (pairs) =>
  pairs.map(([label, value]) => `
    <tr style="border-bottom:1px solid #F2E8E6;">
      <td style="padding:10px 8px; font-weight:600; width:140px; color:#C9A7A0;">${label}</td>
      <td style="padding:10px 8px;">${value}</td>
    </tr>`).join('');

module.exports = { sendAdminNotification, sendClientConfirmation };
