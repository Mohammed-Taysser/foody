import dotenvSafe from 'dotenv-safe';
import { z } from 'zod';

// Load and validate presence (via .env.example)
dotenvSafe.config({
  allowEmptyValues: false,
  example: '.env.example',
  path: '.env',
});

// Define schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number),
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
