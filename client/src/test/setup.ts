import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically clean up rendered components after each test
afterEach(() => {
  cleanup();
});
