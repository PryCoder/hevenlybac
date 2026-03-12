require('dotenv').config();  // ← MUST be the very first line

// Add a guard so you get a clear error if .env is missing
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined. Check your .env file.');
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db');
const contactRoutes = require('./routes/contact');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body Parser ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Global Rate Limiter (brute-force protection) ───────────────────────────
app.use(rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 60,                    // max 60 requests/IP/minute globally
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Trust proxy (for accurate IPs behind Nginx/load balancer) ─────────────
app.set('trust proxy', 1);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/contact', contactRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
});
