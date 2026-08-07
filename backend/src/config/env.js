import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  supabaseProjectId: process.env.SUPABASE_PROJECT_ID,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseFunctionName: process.env.SUPABASE_FUNCTION_NAME || 'make-server-12f1d05f',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
};
