import { test, expect } from '@playwright/test';

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';

test.describe('Staging Security', () => {
  test('returns 401 for protected endpoint without auth', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/sync/batch`, {
      headers: { 'Content-Type': 'application/json' },
      data: { operations: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 401 for protected endpoint with invalid token', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/sync/batch`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_token_12345',
      },
      data: { operations: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('returns safe error for malformed JSON', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/sync/batch`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_token',
      },
      data: 'not valid json{{{',
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('returns safe error for invalid payload', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/sync/batch`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_token',
      },
      data: { invalid: 'payload' },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('health endpoint is public (no auth required)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test('webhook endpoint is public', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123`
    );
    // 403 = invalid verify token (expected), 200 = valid
    expect([200, 403]).toContain(res.status());
  });

  test('no secrets in HTML response', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/`);
    const text = await res.text();
    expect(text).not.toContain('sk-');
    expect(text).not.toContain('rk-');
    expect(text).not.toContain('AKIA');
    expect(text).not.toContain('service_role');
  });

  test('no secrets in manifest', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/manifest.json`);
    const text = await res.text();
    expect(text).not.toContain('sk-');
    expect(text).not.toContain('rk-');
  });

  test('security headers are present', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/`);
    // Check for security headers
    expect(res.headers()['x-content-type-options']).toBeTruthy();
  });
});
