import { test, expect } from '@playwright/test';
test('Pages applies iframe-compatible CSP and preserves true 404 responses', async ({request}) => {
  const response = await request.get('/micro-frontend/communication/v1/');
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'self' https://*.pages.dev http://localhost:* http://127.0.0.1:*");
  expect(headers['x-frame-options']).toBeUndefined();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect((await request.get('/micro-frontend/communication/v1/missing.js')).status()).toBe(404);
});
