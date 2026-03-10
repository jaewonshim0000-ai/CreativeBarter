import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized configuration loaded from environment variables.
 * All secrets and deployment-specific values go through here.
 */
export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database (Supabase PostgreSQL or local)
  databaseUrl: process.env.DATABASE_URL || '',

  // Supabase (optional — for using Supabase Auth/Storage)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // AI/ML Microservice
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;
