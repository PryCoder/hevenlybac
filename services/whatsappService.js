const logger = require('../logger');

const sendWhatsAppAlert = async (data) => {
  // Guard: skip if Pabbly Webhook URL is not configured
  if (!process.env.PABBLY_WEBHOOK_URL) {
    logger.warn('Pabbly Webhook URL not set — skipping WhatsApp/automation alert');
    return;
  }

  try {
    // Send standard JSON payload to Pabbly Connect Catch Hook
    const response = await fetch(process.env.PABBLY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: 'HeavenlyWeds',
        eventType: 'New Inquiry',
        timestamp: new Date().toISOString(),
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone || '—',
        },
        eventDetails: {
          type: data.eventType,
          date: data.date || '—',
          location: data.location || '—',
          guests: data.guests || '—',
          budget: data.budget,
        },
        message: data.message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pabbly webhook responded with status ${response.status}`);
    }

    logger.info(`Pabbly webhook sent successfully for inquiry from ${data.email}`);
  } catch (err) {
    logger.error(`Pabbly notification error: ${err.message}`);
  }
};

module.exports = { sendWhatsAppAlert };
