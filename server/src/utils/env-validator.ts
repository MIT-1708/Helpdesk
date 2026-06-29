import dotenv from 'dotenv';
dotenv.config();

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
