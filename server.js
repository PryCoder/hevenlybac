require('dotenv').config(); // MUST be first

if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI undefined');
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./db');
const contactRoutes = require('./routes/contact');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 5000;

/* ───── COMPRESSION ───── */
app.use(compression());

/* ───── SECURITY ───── */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

/* ───── CORS ───── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://heavenly-6sqh.vercel.app'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS blocked'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

app.options('*', cors());

/* ───── BODY PARSER ───── */
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));

/* ───── TRUST PROXY ───── */
app.set('trust proxy', 1);

/* ───── RATE LIMIT ───── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/'
});

app.use(limiter);

/* ───── DB INIT ───── */
let dbReady = false;

const initDB = async () => {
  if (!dbReady) {
    try {
      await connectDB();
      dbReady = true;
    } catch (err) {
      logger.error(`DB init failed: ${err.message}`);
      dbReady = false;
    }
  }
};

// Initialize DB on startup
if (process.env.NODE_ENV !== 'production') {
  initDB();
}

/* ───── MIDDLEWARE ───── */
app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      await initDB();
    } catch (err) {
      return res.status(503).json({ 
        success: false, 
        message: 'Service temporarily unavailable' 
      });
    }
  }
  next();
});

/* ───── ROUTES ───── */
app.use('/api/contact', contactRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/* ───── 404 ───── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

/* ───── ERROR HANDLER ───── */
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(err.status || 500).json({
    success: false,
    message: 'Server error'
  });
});

/* ───── START ───── */
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'production') {
  start();
}

module.exports = app;