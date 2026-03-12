require('dotenv').config(); // MUST be first

// Check environment variable
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

/* ───────────────── SECURITY HEADERS ───────────────── */
app.use(helmet());

/* ───────────────── CORS CONFIG ───────────────── */

const allowedOrigins = [
  'http://localhost:5173',
  'https://heavenly-6sqh.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {

    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

/* ───────────────── BODY PARSER ───────────────── */

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ───────────────── RATE LIMITER ───────────────── */

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

/* ───────────────── TRUST PROXY ───────────────── */

app.set('trust proxy', 1);

/* ───────────────── ROUTES ───────────────── */

app.use('/api/contact', contactRoutes);

/* ───────────────── HEALTH CHECK ───────────────── */

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

/* ───────────────── 404 HANDLER ───────────────── */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* ───────────────── GLOBAL ERROR HANDLER ───────────────── */

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

/* ───────────────── START SERVER ───────────────── */

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});