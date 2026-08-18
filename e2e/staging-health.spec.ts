import { test, expect } from '@playwright/test';

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';

test.describe('Staging Health Endpoints', () => {
  test('GET /health returns healthy status', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('ai');
  });

  test('GET /health/db responds', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health/db`);
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('GET /health/ai responds', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health/ai`);
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('GET /health/whatsapp responds', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health/whatsapp`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('Health endpoint does not expose secrets', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    const body = await res.json();
    const json = JSON.stringify(body);
    expect(json).not.toContain('sk-');
    expect(json).not.toContain('rk-');
    expect(json).not.toContain('service_role');
    expect(json).not.toContain('AKIA');
  });
});
