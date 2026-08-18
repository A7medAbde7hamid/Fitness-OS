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
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

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

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const version = getVersion();
  const migrations = getMigrations();

  console.log('\n========================================');
  console.log('  Database Migration Runner');
  console.log('========================================');
  console.log(`  Project: ${supabaseUrl}`);
  console.log(`  Version: ${version}`);
  console.log(`  Migrations: ${migrations.length}`);
  console.log('========================================\n');

  console.log('Migrations to apply:');
  migrations.forEach(m => console.log(`  - ${m.filename}`));

  console.log('\nNote: Apply migrations via Supabase Dashboard SQL Editor:');
  console.log(`  1. Go to https://supabase.com/dashboard/project/_/sql`);
  console.log(`  2. Create migration tracking table if not exists:`);
  console.log(`     CREATE TABLE IF NOT EXISTS _migrations (version TEXT PRIMARY KEY, name TEXT, applied_at TIMESTAMPTZ DEFAULT NOW());`);
  console.log(`  3. For each migration, run the SQL and insert into _migrations`);
  console.log(`\nOr use the Supabase CLI:`);
  console.log(`  supabase db push --db-url ${supabaseUrl}`);

  console.log('\n✓ Migration instructions generated');
}

main().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
