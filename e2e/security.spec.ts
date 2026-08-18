import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

test.describe('Security: No hardcoded credentials in source', () => {
  test('app loads without DefaultPassword in bundle', async ({ page }) => {
    await waitForAppReady(page);
    const body = await page.content();
    expect(body).not.toContain('DefaultPassword');
  });
});

test.describe('Security: API auth required', () => {
  test('AI coach endpoint rejects unauthenticated requests', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userId: 'test', language: 'en' }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(result.status).toBe(401);
    expect(result.body.error).toContain('Authentication required');
  });

  test('sync endpoint rejects unauthenticated requests', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: [] }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(result.status).toBe(401);
  });

  test('conversation endpoint rejects unauthenticated requests', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/conversations/user_123');
      return { status: res.status, body: await res.json() };
    });
    // 401 when Supabase configured, 503 when not — both are secure
    expect([401, 503]).toContain(result.status);
  });
});

test.describe('Security: Cross-user access', () => {
  test('conversation endpoint rejects invalid token', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/conversations/user_123', {
        headers: { 'Authorization': 'Bearer fake_token_abc123' },
      });
      return { status: res.status };
    });
    // 401 when Supabase configured (invalid token), 503 when not configured
    expect([401, 503]).toContain(result.status);
  });
});

test.describe('Security: Safe error responses', () => {
  test('API endpoints require auth or return proper errors', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: [] }),
      });
      const body = await res.json();
      return { status: res.status, hasError: Boolean(body.error) };
    });
    expect(result.hasError).toBeTruthy();
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Security: Health check is public', () => {
  test('health endpoint is accessible without auth', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/health');
      return { status: res.status, body: await res.json() };
    });
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('ok');
  });
});

test.describe('Security: Food analysis requires auth', () => {
  test('analyze-food endpoint rejects unauthenticated requests', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'test', language: 'en', mode: 'text' }),
      });
      return { status: res.status };
    });
    expect(result.status).toBe(401);
  });
});

test.describe('Security: No secrets in client bundle', () => {
  test('page source does not contain API keys', async ({ page }) => {
    await waitForAppReady(page);
    const html = await page.content();
    expect(html).not.toMatch(/AIza[0-9A-Za-z_-]{35}/);
    expect(html).not.toContain('service-role');
    expect(html).not.toContain('SUPABASE_SERVICE');
  });
});
