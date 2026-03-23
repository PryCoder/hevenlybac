const mongoose = require('mongoose');
const logger = require('./logger');

let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    logger.error('MONGODB_URI is undefined');
    throw new Error('MONGODB_URI not configured');
  }

  // Return cached connection if valid
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // Prevent multiple simultaneous connections
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const connection = await mongoose.connect(uri, {
        maxPoolSize: 5,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 30000,
        family: 4,
        retryWrites: true,
        w: 'majority',
      });

      cachedConnection = connection;
      connectionPromise = null;
      logger.info('MongoDB connected');
      return connection;
    } catch (err) {
      connectionPromise = null;
      logger.error(`DB error: ${err.message}`);
      throw err;
    }
  })();

  return connectionPromise;
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  cachedConnection = null;
});

module.exports = connectDB;
