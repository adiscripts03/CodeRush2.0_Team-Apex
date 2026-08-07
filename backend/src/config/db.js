import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }
    
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};
