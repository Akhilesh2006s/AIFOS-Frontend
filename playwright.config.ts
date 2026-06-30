import { defineConfig, devices } from '@playwright/test';

const fullStack = process.env.RUN_FULL_E2E === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    navigationTimeout: 45_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: fullStack
    ? [
        {
          command: 'npm run start:dev',
          cwd: '../backend',
          url: 'http://127.0.0.1:3001/api/v1/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long',
            MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/afios_playwright',
            SEED_ADMIN_EMAIL: 'admin@test.afios.local',
            SEED_ADMIN_PASSWORD: 'TestAdmin!Pass2026',
            RATE_LIMIT_PER_MIN: '10000',
            NODE_ENV: 'test',
          },
        },
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 5173',
          url: 'http://127.0.0.1:5173/login',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
