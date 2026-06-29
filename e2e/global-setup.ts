import { spawnSync } from 'child_process';

async function globalSetup() {
  console.log('\n=== PLAYWRIGHT GLOBAL SETUP ===');
  console.log('Starting test database preparation...');

  // Spawn the test-setup script in the root directory using process.cwd()
  const setup = spawnSync('bun', ['run', 'test:setup'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (setup.status !== 0) {
    throw new Error('Playwright Global Setup: Database migration failed.');
  }

  console.log('=== PLAYWRIGHT GLOBAL SETUP COMPLETE ===\n');
}

export default globalSetup;
