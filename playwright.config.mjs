import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'demos.spec.mjs', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4175', launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {} },
  projects: [{ name: 'desktop', use: { viewport: { width: 1280, height: 900 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 } } }],
  webServer: { command: 'npm run preview -- --port 4175', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
});
