const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI in .env
 *
 * Why process.exit(1) on failure:
 * a CRUD API with no database cannot serve a single useful request.
 * Failing loudly at boot is better than failing confusingly on every route.
 */
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. Did you create your .env file?');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
