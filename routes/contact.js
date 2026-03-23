const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Inquiry = require('../models/Inquiry');
const { sendAdminNotification, sendClientConfirmation } = require('../services/emailService');

const logger = require('../logger');

const router = express.Router();

// ── Rate Limiter: max 3 submissions per IP per 15 minutes ──────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: false,
  legacyHeaders: false,
});

// ── Validation Rules ───────────────────────────────────────────────────────
const validateContact = [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone(),
  body('eventType')
    .notEmpty()
    .isIn(['wedding','engagement','reception','sangeet','mehendi','haldi','multiple','other']),
  body('budget').notEmpty(),
  body('message').trim().notEmpty().isLength({ max: 2000 }),
];

// ── POST /api/contact ──────────────────────────────────────────────────────
router.post('/', contactLimiter, validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, phone, date, eventType, location, guests, budget, message } = req.body;

  try {
    // Save to DB immediately
    const inquiry = await Inquiry.create({
      name, email, phone, date, eventType, location, guests, budget, message,
      ip: req.ip
    });

    // Send emails asynchronously (don't wait)
    Promise.all([
      sendAdminNotification({ name, email, phone, date, eventType, location, guests, budget, message }),
      sendClientConfirmation({ name, email })
    ]).catch(err => logger.error(`Email batch error: ${err.message}`));

    res.status(201).json({
      success: true,
      message: "Thank you! We'll contact you within 24 hours.",
      id: inquiry._id,
    });
  } catch (err) {
    logger.error(`Contact error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/contact/health ────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
