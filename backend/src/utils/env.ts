import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8000'),
  DATABASE_URL: z.string().optional(),
  
  // JWT Keys (Required for RS256)
  JWT_PUBLIC_KEY: z.string().min(1, "JWT_PUBLIC_KEY is required for RS256"),
  JWT_PRIVATE_KEY: z.string().min(1, "JWT_PRIVATE_KEY is required for RS256"),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8000'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be 64 characters (hex for 32 bytes)").optional(),

  // Email
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const validateEnv = () => {
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
