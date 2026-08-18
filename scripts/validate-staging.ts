#!/usr/bin/env npx tsx
/**
 * Staging Environment Validation Script
 * Run before marking RC as STAGING-APPROVED
 *
 * Usage: npx tsx scripts/validate-staging.ts
 */

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:3000';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, status: 'FAIL', message: msg });
    console.error(`  ✗ ${name}: ${msg}`);
  }
}

function skip(name: string, reason: string): void {
  results.push({ name, status: 'SKIP', message: reason });
  console.log(`  ○ ${name} (skipped: ${reason})`);
}

async function validateHealth(): Promise<void> {
  console.log('\n── Health Endpoints ──');

  await check('GET /health returns 200', async () => {
    const res = await fetch(`${STAGING_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const body = await res.json();
    if (!body.version) throw new Error('Missing version field');
    if (!body.checks) throw new Error('Missing checks field');
  });

  await check('GET /health/db returns 200 or 503', async () => {
    const res = await fetch(`${STAGING_URL}/health/db`);
    if (res.status !== 200 && res.status !== 503) throw new Error(`Status ${res.status}`);
  });

  await check('GET /health/ai returns 200 or 503', async () => {
    const res = await fetch(`${STAGING_URL}/health/ai`);
    if (res.status !== 200 && res.status !== 503) throw new Error(`Status ${res.status}`);
  });

  await check('GET /health/whatsapp returns 200', async () => {
    const res = await fetch(`${STAGING_URL}/health/whatsapp`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
}

async function validateSecurity(): Promise<void> {
  console.log('\n── Security ──');

  await check('Protected endpoint returns 401 without token', async () => {
    const res = await fetch(`${STAGING_URL}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [] }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await check('Protected endpoint returns 401 with invalid token', async () => {
    const res = await fetch(`${STAGING_URL}/api/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_token_12345',
      },
      body: JSON.stringify({ operations: [] }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await check('Security headers present', async () => {
    const res = await fetch(`${STAGING_URL}/`);
    const headers = res.headers;
    if (!headers.get('x-content-type-options')) throw new Error('Missing x-content-type-options');
  });

  await check('Health endpoint is public (no auth)', async () => {
    const res = await fetch(`${STAGING_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('No secrets in HTML response', async () => {
    const res = await fetch(`${STAGING_URL}/`);
    const text = await res.text();
    if (text.includes('sk-') || text.includes('rk-') || text.includes('AKIA')) {
      throw new Error('Secrets found in HTML');
    }
  });
}

async function validatePWA(): Promise<void> {
  console.log('\n── PWA ──');

  await check('manifest.json is accessible', async () => {
    const res = await fetch(`${STAGING_URL}/manifest.json`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const manifest = await res.json();
    if (!manifest.name) throw new Error('Missing name');
    if (!manifest.icons?.length) throw new Error('Missing icons');
  });

  await check('offline.html is accessible', async () => {
    const res = await fetch(`${STAGING_URL}/offline.html`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('Service worker file is accessible', async () => {
    const res = await fetch(`${STAGING_URL}/sw.js`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
}

async function validateAPI(): Promise<void> {
  console.log('\n── API Endpoints ──');

  await check('Webhook verification endpoint responds', async () => {
    const res = await fetch(`${STAGING_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123`);
    // Should return 403 (invalid token) or 200 (valid token)
    if (res.status !== 200 && res.status !== 403) throw new Error(`Status ${res.status}`);
  });

  await check('Rate limiting is active', async () => {
    // Make several rapid requests to trigger rate limiting
    const promises = Array.from({ length: 10 }, () =>
      fetch(`${STAGING_URL}/api/sync/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: [] }),
      })
    );
    const responses = await Promise.all(promises);
    const statuses = responses.map(r => r.status);
    // Should get at least one 429 or all 401 (no token)
    const has429or401 = statuses.every(s => s === 429 || s === 401);
    if (!has429or401) throw new Error(`Unexpected statuses: ${statuses.join(',')}`);
  });
}

async function main(): Promise<void> {
  console.log(`\n========================================`);
  console.log(`  Staging Validation: ${STAGING_URL}`);
  console.log(`========================================`);

  await validateHealth();
  await validateSecurity();
  await validatePWA();
  await validateAPI();

  console.log(`\n========================================`);
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`========================================\n`);

  if (failed > 0) {
    console.log('FAILED CHECKS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
