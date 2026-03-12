const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI is undefined — check your .env file');
    process.exit(1);
  }
  // Log masked URI for confirmation (shows only the host part)
  logger.info(`Connecting to MongoDB: ${uri.replace(/:\/\/.*@/, '://<credentials>@')}`);

  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = connectDB;
