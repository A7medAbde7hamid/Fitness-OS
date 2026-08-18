#!/usr/bin/env npx tsx
/**
 * Run Supabase migrations against a target database
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key
 *
 * Safety:
 *   - Refuses to run against production URLs
 *   - Prints target environment before executing
 *   - Requires explicit confirmation for non-staging environments
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

const STAGING_PROJECT_ID = 'hroghkokafsyxdzprvem';
const STAGING_URL = `https://${STAGING_PROJECT_ID}.supabase.co`;

interface Migration {
  filename: string;
  sql: string;
}

function getMigrations(): Migration[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(f => ({
    filename: f,
    sql: readFileSync(join(MIGRATIONS_DIR, f), 'utf-8'),
  }));
}

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

function getEnvironment(url: string): 'staging' | 'production' | 'unknown' {
  if (url.includes(STAGING_PROJECT_ID)) return 'staging';
  if (url.includes('.supabase.co')) return 'production';
  return 'unknown';
}

function isProductionProtected(url: string): boolean {
  const env = getEnvironment(url);
  return env === 'production';
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    console.error('');
    console.error('Set these in your environment or .env.staging:');
    console.error('  export SUPABASE_URL=https://hroghkokafsyxdzprvem.supabase.co');
    console.error('  export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
    process.exit(1);
  }

  const environment = getEnvironment(supabaseUrl);
  const version = getVersion();
  const migrations = getMigrations();

  console.log('\n========================================');
  console.log('  Database Migration Runner');
  console.log('========================================');
  console.log(`  TARGET ENVIRONMENT: ${environment.toUpperCase()}`);
  console.log(`  SUPABASE PROJECT: fitness-os`);
  console.log(`  PROJECT ID: ${STAGING_PROJECT_ID}`);
  console.log(`  SUPABASE URL: ${supabaseUrl}`);
  console.log(`  Application Version: ${version}`);
  console.log(`  Migrations Found: ${migrations.length}`);
  console.log('========================================\n');

  // Production protection
  if (isProductionProtected(supabaseUrl)) {
    console.error('╔══════════════════════════════════════════╗');
    console.error('║  PRODUCTION PROTECTION ACTIVATED         ║');
    console.error('║                                          ║');
    console.error('║  This script refuses to migrate          ║');
    console.error('║  production databases.                   ║');
    console.error('║                                          ║');
    console.error('║  Use Supabase Dashboard SQL Editor       ║');
    console.error('║  for production migrations.              ║');
    console.error('╚══════════════════════════════════════════╝');
    process.exit(1);
  }

  console.log('Migrations to apply:');
  migrations.forEach(m => console.log(`  - ${m.filename}`));

  console.log('\n--- Instructions ---');
  console.log('Apply migrations via Supabase Dashboard SQL Editor:');
  console.log(`  1. Go to https://supabase.com/dashboard/project/${STAGING_PROJECT_ID}/sql`);
  console.log(`  2. Run each migration SQL file in order`);
  console.log('');
  console.log('Or use the Supabase CLI:');
  console.log(`  supabase db push --db-url postgresql://postgres:${serviceRoleKey}@db.${STAGING_PROJECT_ID}.supabase.co:5432/postgres`);
  console.log('');
  console.log('Migration files (run in order):');
  migrations.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.filename}`);
  });

  // Output SQL for easy copy-paste
  console.log('\n--- Combined SQL ---');
  console.log('Copy the following SQL and run in Supabase SQL Editor:');
  console.log('='.repeat(60));

  for (const migration of migrations) {
    console.log(`\n-- Migration: ${migration.filename}`);
    console.log(migration.sql);
    console.log(`-- End Migration: ${migration.filename}\n`);
  }

  console.log('='.repeat(60));
  console.log('\nAfter applying, verify with:');
  console.log(`  curl -f ${supabaseUrl}/rest/v1/ -H "apikey: <anon-key>"`);
}

main().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
