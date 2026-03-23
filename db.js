const mongoose = require('mongoose');
const logger = require('./logger');

// Cache the connection globally to reuse across invocations
let cachedConnection = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    logger.error('MONGODB_URI is undefined — check your .env file');
    process.exit(1);
  }

  // Return cached connection if it exists and is valid
  if (cachedConnection) {
    logger.info('Using cached MongoDB connection');
    return cachedConnection;
  }

  // Log masked URI for confirmation
  logger.info(`Connecting to MongoDB: ${uri.replace(/:\/\/.*@/, '://<credentials>@')}`);

  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: 1, // Vercel Hobby Plan limitation
      minPoolSize: 0,
      maxIdleTimeMS: 45000, // Close idle connections after 45s
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Cache the connection
    cachedConnection = connection;
    logger.info('MongoDB connected successfully');
    return connection;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
};

// Handle disconnection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  cachedConnection = null;
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
