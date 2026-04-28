import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${process.env.PORT || 3001}`,
    headless: true,
    locale: 'fr-FR',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Start the test server before E2E tests run.
  // Set E2E_SERVER_URL env var to skip launching (use an already-running server).
  webServer: process.env.E2E_SERVER_URL
    ? undefined
    : {
        command: 'npx ts-node -e "require(\'dotenv\').config({path:\'.env.test\'}); const {runMigrations}=require(\'./src/db\'); const {createApp}=require(\'./src/index\'); runMigrations().then(()=>{ const app=createApp(); app.listen(3001, ()=>console.log(\'E2E server on 3001\')); });"',
        port: 3001,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
