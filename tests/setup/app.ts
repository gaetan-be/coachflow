import { createApp } from '../../src/index';

// Returns a configured Express app without starting the server or worker.
// The pool inside db.ts connects to DATABASE_URL from .env.test (set by vitest.config.ts).
export function buildTestApp() {
  return createApp();
}
