#!/usr/bin/env npx tsx
/**
 * Deploy script for AI Fitness OS
 *
 * Usage:
 *   npx tsx scripts/deploy.ts --env staging
 *   npx tsx scripts/deploy.ts --env production
 *
 * Prerequisites:
 *   - Environment variables set (see .env.staging.example)
 *   - Node.js 20+
 *   - npm dependencies installed
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

interface DeployOptions {
  env: 'staging' | 'production';
  skipTests: boolean;
  skipBuild: boolean;
  dryRun: boolean;
}

function parseArgs(): DeployOptions {
  const args = process.argv.slice(2);
  const opts: DeployOptions = {
    env: 'staging',
    skipTests: false,
    skipBuild: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) opts.env = args[i + 1] as 'staging' | 'production';
    if (args[i] === '--skip-tests') opts.skipTests = true;
    if (args[i] === '--skip-build') opts.skipBuild = true;
    if (args[i] === '--dry-run') opts.dryRun = true;
  }

  return opts;
}

function run(cmd: string, description: string): void {
  console.log(`\n→ ${description}`);
  console.log(`  $ ${cmd}`);
  if (!opts.dryRun) {
    try {
      execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    } catch (err) {
      console.error(`\n✗ FAILED: ${description}`);
      process.exit(1);
    }
  } else {
    console.log('  (dry run - skipped)');
  }
}

function checkEnvVars(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`\n✗ Missing required environment variables:`);
    missing.forEach(v => console.error(`  - ${v}`));
    console.error(`\nSet these in your deployment platform or .env.${opts.env}`);
    process.exit(1);
  }
  console.log('\n✓ All required environment variables present');
}

function getVersion(): string {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  return pkg.version;
}

const opts = parseArgs();
const version = getVersion();

console.log('========================================');
console.log('  AI Fitness OS Deployment');
console.log('========================================');
console.log(`  Environment: ${opts.env}`);
console.log(`  Version: ${version}`);
console.log(`  Dry run: ${opts.dryRun}`);
console.log('========================================');

// 1. Check environment variables
console.log('\n── Step 1: Environment Check ──');
checkEnvVars();

// 2. Install dependencies
console.log('\n── Step 2: Install Dependencies ──');
run('npm ci', 'Installing dependencies');

// 3. Type check
console.log('\n── Step 3: Type Check ──');
run('npm run lint', 'Running TypeScript type check');

// 4. Unit tests
if (!opts.skipTests) {
  console.log('\n── Step 4: Unit Tests ──');
  run('npm test', 'Running unit tests');
}

// 5. Build
if (!opts.skipBuild) {
  console.log('\n── Step 5: Production Build ──');
  run('npm run build', 'Building for production');
}

// 6. Security scan
console.log('\n── Step 6: Security Scan ──');
run(
  `node -e "const fs=require('fs');const files=['dist/index.html'];files.forEach(f=>{if(fs.existsSync(f)){const c=fs.readFileSync(f,'utf8');if(c.includes('sk-')||c.includes('rk-')||c.includes('AKIA')){console.error('SECRETS FOUND IN '+f);process.exit(1)}}});console.log('No secrets found')"`,
  'Scanning build output for secrets'
);

// 7. Deployment summary
console.log('\n========================================');
console.log('  Deployment Summary');
console.log('========================================');
console.log(`  Environment: ${opts.env}`);
console.log(`  Version: ${version}`);
console.log(`  Status: READY TO DEPLOY`);
console.log('');
console.log('  Next steps:');
if (opts.env === 'staging') {
  console.log('  1. Deploy dist/ to your staging platform');
  console.log('  2. Set environment variables in platform');
  console.log('  3. Run: npx tsx scripts/validate-staging.ts');
  console.log('  4. Run E2E tests against staging');
} else {
  console.log('  1. Ensure staging is approved');
  console.log('  2. Deploy dist/ to production');
  console.log('  3. Set environment variables');
  console.log('  4. Run health checks');
  console.log('  5. Monitor for 24 hours');
}
console.log('========================================');
