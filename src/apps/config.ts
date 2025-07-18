import type { DotenvParseOutput } from 'dotenv';
import { config as loadEnvSafe } from 'dotenv-safe';
import { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

import timezones from '../../public/timezones.json';

// Extract the list of valid timezone names
const validTimezones = timezones.map((tz) => tz.tzCode);

// 🌟 STEP 1: Load and validate presence (via .env.example)
try {
  loadEnvSafe({
    allowEmptyValues: true,
    example: '.env.example',
    path: '.env',
  });
} catch (error) {
  const err = error as Error | DotenvParseOutput;

  if (!(err instanceof Error) && err.name === 'MissingEnvVarsError') {
    console.error('\n❌ Missing required environment variables:\n');

    const missingVars = err.missing || [];
    for (const v of missingVars) {
      console.error(`• ${v}`);
    }

    console.error('\n→ Check your .env file or set them in the system environment.');
    process.exit(1);
  }

  // Other unexpected errors
  throw err;
}

// 🌟 STEP 2: Validate using Zod
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().trim().transform(Number),

  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((val) => {
      const origins = val
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== '');
      return origins;
    }),

  DEFAULT_TIMEZONE: z.enum(validTimezones as [string, ...string[]]).default('UTC'),

  JWT_SECRET: z.string().trim().min(10),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
  JWT_RESET_PASSWORD_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
  JWT_EMAIL_VERIFICATION_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, {
      message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
    }) as z.ZodType<SignOptions['expiresIn']>,
});

// Validate and catch errors with friendly messages
// let CONFIG: z.infer<typeof envSchema>;
const ennValidation = envSchema.safeParse(process.env);

if (!ennValidation.success) {
  console.error('❌ Environment variable validation failed:\n');

  if (ennValidation.error instanceof z.ZodError) {
    for (const issue of ennValidation.error.errors) {
      console.error(`• ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error(ennValidation.error);
  }

  process.exit(1); // Exit with failure
}

// 🌟 STEP 3: Extract the validated environment variables
const CONFIG = ennValidation.data;

export default CONFIG;
