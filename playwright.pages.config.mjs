import { defineConfig } from '@playwright/test';
import base from './playwright.config.mjs';
export default defineConfig({
  ...base,
  testMatch: ['demos.spec.mjs', 'storefront.spec.mjs', 'labs.spec.mjs', 'pages.spec.mjs'],
  webServer: { command: 'npm run preview:pages', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
});
