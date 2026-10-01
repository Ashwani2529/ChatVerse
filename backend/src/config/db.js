const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.mongo_uri;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Add MONGO_URI=<your connection string> to backend/.env'
    );
  }

  mongoose.connection.on('connected', () => {
    console.log('🍃 MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });

  return mongoose.connection;
};

module.exports = connectDB;
