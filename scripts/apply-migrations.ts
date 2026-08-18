#!/usr/bin/env npx tsx
/**
 * Apply migrations to Supabase via SQL API
 *
 * Usage:
 *   npx tsx scripts/apply-migrations.ts
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key
 *
 * Safety:
 *   - Only targets staging project (hroghkokafsyxdzprvem)
 *   - Refuses production URLs
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

const STAGING_PROJECT_ID = 'hroghkokafsyxdzprvem';

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

function getEnvironment(url: string): 'staging' | 'production' | 'unknown' {
  if (url.includes(STAGING_PROJECT_ID)) return 'staging';
  if (url.includes('.supabase.co')) return 'production';
  return 'unknown';
}

async function executeSQL(supabaseUrl: string, serviceRoleKey: string, sql: string): Promise<boolean> {
  const endpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`    HTTP ${response.status}: ${text.substring(0, 200)}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`    Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return false;
  }
}

async function executeRawSQL(supabaseUrl: string, serviceRoleKey: string, sql: string): Promise<boolean> {
  // Use the SQL endpoint directly
  const endpoint = `${supabaseUrl}/sql`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`    HTTP ${response.status}: ${text.substring(0, 200)}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`    Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return false;
  }
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const environment = getEnvironment(supabaseUrl);

  console.log('\n========================================');
  console.log('  Supabase Migration Applier');
  console.log('========================================');
  console.log(`  TARGET ENVIRONMENT: ${environment.toUpperCase()}`);
  console.log(`  SUPABASE PROJECT: fitness-os`);
  console.log(`  PROJECT ID: ${STAGING_PROJECT_ID}`);
  console.log(`  SUPABASE URL: ${supabaseUrl}`);
  console.log('========================================\n');

  // Production protection
  if (environment === 'production') {
    console.error('PRODUCTION PROTECTION: Refusing to migrate production database.');
    console.error('Use Supabase Dashboard SQL Editor for production migrations.');
    process.exit(1);
  }

  const migrations = getMigrations();
  console.log(`Found ${migrations.length} migrations\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    console.log(`Applying: ${migration.filename}`);

    // Split SQL into individual statements
    const statements = migration.sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let migrationSuccess = true;
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;

      const success = await executeRawSQL(supabaseUrl, serviceRoleKey, statement + ';');
      if (!success) {
        console.error(`  Failed on statement in ${migration.filename}`);
        migrationSuccess = false;
        break;
      }
    }

    if (migrationSuccess) {
      console.log(`  ✓ Applied`);
      successCount++;
    } else {
      console.error(`  ✗ Failed`);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log(`  Results: ${successCount} applied, ${failCount} failed`);
  console.log('========================================\n');

  if (failCount > 0) {
    console.error('Some migrations failed. Check errors above.');
    console.error('You may need to apply failed migrations manually via Supabase Dashboard.');
    process.exit(1);
  }

  console.log('All migrations applied successfully!');
  console.log('\nVerify with:');
  console.log(`  curl -f ${supabaseUrl}/rest/v1/ -H "apikey: <anon-key>"`);
}

main().catch(err => {
  console.error('Migration applier failed:', err);
  process.exit(1);
});
