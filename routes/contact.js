const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Inquiry = require('../models/Inquiry');
const { sendAdminNotification, sendClientConfirmation } = require('../services/emailService');

const logger = require('../logger');

const router = express.Router();

// ── Rate Limiter: max 5 submissions per IP per 15 minutes ──────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit hit: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// ── Validation Rules ───────────────────────────────────────────────────────
const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  body('eventType')
    .notEmpty().withMessage('Event type is required')
    .isIn(['wedding','engagement','reception','sangeet','mehendi','haldi','multiple','other']),
  body('budget').notEmpty().withMessage('Budget range is required'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  body('location').optional({ checkFalsy: true }).isLength({ max: 200 }),
  body('guests').optional({ checkFalsy: true }),
];

// ── POST /api/contact ──────────────────────────────────────────────────────
router.post('/', contactLimiter, validateContact, async (req, res) => {
  // Set a 30-second timeout for this endpoint
  req.setTimeout(30000);
  res.setTimeout(30000);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, phone, date, eventType, location, guests, budget, message } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    // 1. Persist to MongoDB
    const inquiry = await Inquiry.create({ name, email, phone, date, eventType, location, guests, budget, message, ip });
    logger.info(`Inquiry saved: ${inquiry._id} from ${email}`);

    // 2. Send notifications concurrently (non-blocking failures)
    const notifications = await Promise.allSettled([
      sendAdminNotification({ name, email, phone, date, eventType, location, guests, budget, message }),
      sendClientConfirmation({ name, email }),
     
    ]);

    notifications.forEach((result, i) => {
      const labels = ['Admin email', 'Client email', 'WhatsApp'];
      if (result.status === 'rejected') {
        logger.error(`${labels[i]} notification failed: ${result.reason?.message}`);
      }
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! We've received your inquiry and will be in touch within 24 hours.",
      id: inquiry._id,
    });
  } catch (err) {
    logger.error(`Contact route error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// ── GET /api/contact/health ────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
