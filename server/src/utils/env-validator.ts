import dotenv from 'dotenv';
import path from 'path';

// Load .env.test if running in test environment
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CLIENT_URL',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL STARTUP ERROR: Missing required environment variables:');
    missing.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }

  console.log('✅ Required environment variables verified.');
}
