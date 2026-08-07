import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }

    const conn = await mongoose.connect(env.mongoUri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    // Log the error but do NOT crash the server — the app runs on GeoJSON files,
    // MongoDB is optional for the core disaster management features.
    console.warn('[MongoDB] Connection failed (non-fatal):', error.message);
    console.warn('[MongoDB] Server will continue without database. DB-dependent features will be unavailable.');
    // Do not call process.exit(1) — keep the API server running
  }
};
