import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/bumdes_banyubening?schema=public'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: requireEnv('JWT_SECRET', 'super-secret-jwt-key-change-in-production-32chars!!'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET', 'super-secret-refresh-key-change-in-production-32chars!!'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PIN_CODE: process.env.PIN_CODE || '123456',
  PIN_HASH: process.env.PIN_HASH || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || '',
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY || '',
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  BACKUP_CRON: process.env.BACKUP_CRON || '0 2 * * *', // daily 2am
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
