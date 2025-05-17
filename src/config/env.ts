import { config as loadEnvSafe } from 'dotenv-safe';
import type { DotenvParseOutput } from 'dotenv';
import { z } from 'zod';

// 🌟 STEP 1: Load and validate presence (via .env.example)
try {
  loadEnvSafe({
    allowEmptyValues: false,
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
  PORT: z.string().transform(Number),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, {
    message: 'JWT_EXPIRES_IN must be a duration like "7d", "15m", "1h", or "30s"',
  }),
});

// Validate and catch errors with friendly messages
let CONFIG: z.infer<typeof envSchema>;

try {
  CONFIG = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment variable validation failed:\n');

  if (error instanceof z.ZodError) {
    for (const issue of error.errors) {
      console.error(`• ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error(error);
  }

  process.exit(1); // Exit with failure
}

export default CONFIG;
