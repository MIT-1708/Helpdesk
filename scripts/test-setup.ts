import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Load test environment
dotenv.config({ path: path.resolve(dirname, '../server/.env.test') });

console.log('Preparing test database...');
console.log(`Target database URL: ${process.env.DATABASE_URL}`);

// Run prisma db push to apply migrations to the test database
const dbPush = spawnSync('bunx', ['prisma', 'db', 'push', '--schema=prisma/schema.prisma'], {
  cwd: path.resolve(dirname, '../server'),
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  stdio: 'inherit',
});

if (dbPush.status !== 0) {
  console.error('Failed to setup test database schema.');
  process.exit(dbPush.status || 1);
}

console.log('Test database schema prepared successfully.');
