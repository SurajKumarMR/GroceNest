import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8000'),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  
  // JWT Keys (Required for RS256 in production)
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8000'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().optional(),

  // Email/SMS/Monitoring (Required in prod)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const requiredInProd = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'TWILIO_ACCOUNT_SID',
    'SENDGRID_API_KEY',
    'SENTRY_DSN',
  ];

  if (isProduction) {
    const missing = requiredInProd.filter(v => !process.env[v]);
    if (missing.length > 0) {
      console.error(`❌ Missing required production environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:', JSON.stringify(error.format(), null, 2));
      process.exit(1);
    }
    throw error;
  }
};

export const env = validateEnv();
export default env;
