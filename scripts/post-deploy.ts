#!/usr/bin/env npx tsx
/**
 * Post-deploy verification script
 *
 * Usage:
 *   npx tsx scripts/post-deploy.ts --url https://staging.yourdomain.com
 */

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL';
  latencyMs?: number;
  details?: string;
}

const BASE_URL = process.argv.find((a: string) => a.startsWith('--url='))?.split('=')[1]
  || process.env.STAGING_URL
  || 'http://localhost:3000';

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<{ ok: boolean; latencyMs: number; details?: string }>): Promise<void> {
  process.stdout.write(`  ${name}... `);
  try {
    const result = await fn();
    const status = result.ok ? 'PASS' : 'FAIL';
    results.push({ name, status, latencyMs: result.latencyMs, details: result.details });
    console.log(`${status} (${result.latencyMs}ms)${result.details ? ' - ' + result.details : ''}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', details: err instanceof Error ? err.message : 'Unknown' });
    console.log(`FAIL - ${err instanceof Error ? err.message : 'Unknown'}`);
  }
}

async function fetchCheck(path: string): Promise<{ ok: boolean; latencyMs: number; details?: string }> {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`);
  const latencyMs = Date.now() - start;
  return { ok: res.ok, latencyMs, details: `Status ${res.status}` };
}

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  Post-Deploy Verification');
  console.log('========================================');
  console.log(`  URL: ${BASE_URL}`);
  console.log('========================================\n');

  // Health checks
  console.log('── Health Endpoints ──');
  await check('GET /health', () => fetchCheck('/health'));
  await check('GET /health/db', () => fetchCheck('/health/db'));
  await check('GET /health/ai', () => fetchCheck('/health/ai'));
  await check('GET /health/whatsapp', () => fetchCheck('/health/whatsapp'));

  // Static assets
  console.log('\n── Static Assets ──');
  await check('GET /', () => fetchCheck('/'));
  await check('GET /manifest.json', () => fetchCheck('/manifest.json'));
  await check('GET /offline.html', () => fetchCheck('/offline.html'));

  // Security
  console.log('\n── Security ──');
  await check('POST /api/sync/batch (no auth)', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [] }),
    });
    const latencyMs = Date.now() - start;
    return { ok: res.status === 401, latencyMs, details: `Expected 401, got ${res.status}` };
  });

  await check('No secrets in HTML', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/`);
    const text = await res.text();
    const latencyMs = Date.now() - start;
    const hasSecrets = text.includes('sk-') || text.includes('rk-') || text.includes('AKIA');
    return { ok: !hasSecrets, latencyMs, details: hasSecrets ? 'SECRETS FOUND' : 'Clean' };
  });

  // Summary
  console.log('\n========================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('FAILED CHECKS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  X ${r.name}: ${r.details}`);
    });
    process.exit(1);
  }

  console.log('All checks passed!');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
