const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const contactRouter = require('./routes/contact');
const logger = require('./logger');

const app = express();

/* ...existing middleware setup... */

// Call connectDB once at server startup (for local) or on first request (for Vercel)
let dbConnected = false;

app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      logger.error(`Failed to connect to DB: ${err.message}`);
      return res.status(503).json({ success: false, message: 'Database connection failed' });
    }
  }
  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

/* ...existing middleware... */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

/* ...existing routes... */
app.use('/api/contact', contactRouter);

/* ...existing error handling... */

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
