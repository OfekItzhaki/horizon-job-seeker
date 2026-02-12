/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set
 */

import { logger } from './logger.js';

interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // AI/ML
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;

  // Scrapers
  ADZUNA_APP_ID?: string;
  ADZUNA_API_KEY?: string;
  LINKEDIN_EMAIL?: string;
  LINKEDIN_PASSWORD?: string;

  // Server
  PORT: number;
  NODE_ENV: string;

  // Frontend
  FRONTEND_URL?: string;
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Optional but recommended
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    warnings.push('Neither GROQ_API_KEY nor OPENAI_API_KEY is set - job scoring will be disabled');
  }

  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_API_KEY) {
    warnings.push('ADZUNA_APP_ID or ADZUNA_API_KEY not set - Adzuna scraper will be disabled');
  }

  // Log errors and warnings
  if (errors.length > 0) {
    errors.forEach((error) => logger.error(`Environment validation error: ${error}`));
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn(`Environment validation warning: ${warning}`));
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ADZUNA_APP_ID: process.env.ADZUNA_APP_ID,
    ADZUNA_API_KEY: process.env.ADZUNA_API_KEY,
    LINKEDIN_EMAIL: process.env.LINKEDIN_EMAIL,
    LINKEDIN_PASSWORD: process.env.LINKEDIN_PASSWORD,
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL,
  };
}

export const env = validateEnv();
