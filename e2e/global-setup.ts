import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

async function globalSetup() {
  console.log('\n=== PLAYWRIGHT GLOBAL SETUP ===');
  console.log('Starting test database preparation...');

  // Spawn the test-setup script in the root directory
  const setup = spawnSync('bun', ['run', 'test:setup'], {
    cwd: path.resolve(dirname, '..'),
    stdio: 'inherit',
  });

  if (setup.status !== 0) {
    throw new Error('Playwright Global Setup: Database migration failed.');
  }

  console.log('=== PLAYWRIGHT GLOBAL SETUP COMPLETE ===\n');
}

export default globalSetup;
