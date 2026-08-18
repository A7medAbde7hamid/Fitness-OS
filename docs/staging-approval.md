# Staging Approval — v1.0.0-rc.1

**Version**: 1.0.0-rc.1
**Date**: August 18, 2026
**Status**: STAGING BLOCKED (pending deployment and migration)

---

## Staging Environment

| Field | Value |
|-------|-------|
| RC Version | 1.0.0-rc.1 |
| Supabase Project | fitness-os |
| Project ID | hroghkokafsyxdzprvem |
| Region | EU Central (Frankfurt) |
| Supabase URL | https://hroghkokafsyxdzprvem.supabase.co |
| Staging URL | [NOT YET DEPLOYED] |
| Deployment Commit | 99d4a9c |
| Migration Version | 20260818000000 |

---

## Pre-Deployment Verification

| Check | Status | Evidence |
|-------|--------|----------|
| TypeScript | PASS | `npx tsc --noEmit` — 0 errors |
| Unit tests | PASS | 181/181 pass |
| WhatsApp tests | PASS | 48/48 pass |
| Production build | PASS | `npm run build` clean |
| Security scan | PASS | No secrets in source/dist |
| Staging E2E tests | CREATED | 6 test files ready |
| Deployment scripts | CREATED | deploy.ts, migrate.ts, apply-migrations.ts, post-deploy.ts |
| Staging workflow | CREATED | .github/workflows/staging.yml with proper secrets |

---

## GitHub Actions Secrets Required

Configure these in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `STAGING_SUPABASE_URL` | Supabase project URL | `https://hroghkokafsyxdzprvem.supabase.co` |
| `STAGING_SUPABASE_ANON_KEY` | Supabase anon/publishable key | [From Supabase Dashboard] |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | [From Supabase Dashboard → Settings → API] |
| `STAGING_GEMINI_API_KEY` | Gemini API key (optional) | [If AI testing needed] |

**DO NOT commit these secrets to the repository.**

---

## Migration Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/hroghkokafsyxdzprvem/sql
2. Run each migration file in order:
   - `20260817000000_initial_schema.sql`
   - `20260817000001_meals_summaries_conversations.sql`
   - `20260818000000_whatsapp_integration.sql`

### Option 2: Via Script

```bash
# Set environment
export SUPABASE_URL=https://hroghkokafsyxdzprvem.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Apply migrations
npx tsx scripts/apply-migrations.ts
```

### Expected Tables After Migration

- profiles
- goals
- user_preferences
- measurements
- meals
- food_items
- activities
- workouts
- workout_exercises
- ai_conversations
- ai_messages
- daily_summaries
- whatsapp_connections
- whatsapp_message_log
- pending_whatsapp_meals

---

## Deployment Steps

### 1. Apply Migrations

```bash
export SUPABASE_URL=https://hroghkokafsyxdzprvem.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
npx tsx scripts/apply-migrations.ts
```

### 2. Configure Environment

Copy `.env.staging.example` to `.env.staging` and fill in:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY`)
- `GEMINI_API_KEY` (if testing AI)

### 3. Deploy Application

```bash
# Build
npm run build

# Deploy dist/ to your hosting platform
```

### 4. Run Validation

```bash
export STAGING_URL=<your-deployed-url>

# Health checks
npx tsx scripts/post-deploy.ts --url=$STAGING_URL

# E2E tests
STAGING_URL=$STAGING_URL npx playwright test --config=playwright.staging.config.ts
```

---

## Validation Results

### Health Endpoints

| Endpoint | Status | Latency | Notes |
|----------|--------|---------|-------|
| GET /health | [ ] PENDING | - | - |
| GET /health/db | [ ] PENDING | - | - |
| GET /health/ai | [ ] PENDING | - | - |
| GET /health/whatsapp | [ ] PENDING | - | - |

### Database

| Check | Status | Notes |
|-------|--------|-------|
| Schema matches | [ ] PENDING | - |
| RLS policies active | [ ] PENDING | - |
| Indexes exist | [ ] PENDING | - |
| No production data | [ ] PENDING | - |
| Migrations applied | [ ] PENDING | - |

### E2E Tests

| Test Suite | Status | Pass/Fail |
|------------|--------|-----------|
| staging-full.spec.ts | [ ] PENDING | - |
| staging-health.spec.ts | [ ] PENDING | - |
| staging-security.spec.ts | [ ] PENDING | - |
| staging-sync.spec.ts | [ ] PENDING | - |

### Security

| Check | Status | Notes |
|-------|--------|-------|
| 401 without JWT | [ ] PENDING | - |
| 401 with invalid JWT | [ ] PENDING | - |
| Rate limiting | [ ] PENDING | - |
| No secrets in bundle | [ ] PENDING | - |
| Security headers | [ ] PENDING | - |

### AI

| Check | Status | Notes |
|-------|--------|-------|
| Normal question | [ ] PENDING | - |
| Tool execution | [ ] PENDING | - |
| Image analysis | [ ] PENDING | - |
| No client-side keys | [ ] PENDING | - |

### WhatsApp

| Check | Status | Notes |
|-------|--------|-------|
| Webhook verification | [ ] PENDING | - |
| Text message | [ ] PENDING | - |
| Duplicate handling | [ ] PENDING | - |
| Arabic/English reply | [ ] PENDING | - |

### PWA

| Check | Status | Notes |
|-------|--------|-------|
| manifest.json | [ ] PENDING | - |
| Service worker | [ ] PENDING | - |
| Offline fallback | [ ] PENDING | - |

---

## Approval

| Gate | Status | Verified By | Date |
|------|--------|-------------|------|
| Pre-deployment checks | PASS | automated | 2026-08-18 |
| Supabase project created | PASS | user confirmed | 2026-08-18 |
| Migrations applied | [ ] PENDING | - | - |
| Deployment | [ ] PENDING | - | - |
| Health endpoints | [ ] PENDING | - | - |
| E2E tests | [ ] PENDING | - | - |
| Security checks | [ ] PENDING | - | - |
| AI verification | [ ] PENDING | - | - |
| WhatsApp sandbox | [ ] PENDING | - | - |
| Manual QA | [ ] PENDING | - | - |

---

## FINAL STATUS

**STAGING BLOCKED**

The staging Supabase project is created but migrations have not been applied and the application is not deployed. A human must:

1. Apply migrations to https://hroghkokafsyxdzprvem.supabase.co
2. Deploy application to a hosting platform
3. Configure GitHub Actions secrets
4. Run validation commands
5. Complete manual QA checklist
6. Update this document with results
7. Change status to STAGING APPROVED (if all pass)

---

## Appendix: Validation Commands

```bash
# Apply migrations
export SUPABASE_URL=https://hroghkokafsyxdzprvem.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your-key>
npx tsx scripts/apply-migrations.ts

# Health checks
curl -f $STAGING_URL/health
curl -f $STAGING_URL/health/db
curl -f $STAGING_URL/health/ai
curl -f $STAGING_URL/health/whatsapp

# E2E tests
STAGING_URL=$STAGING_URL npx playwright test --config=playwright.staging.config.ts

# Full validation
npx tsx scripts/validate-staging.ts
npx tsx scripts/post-deploy.ts --url=$STAGING_URL
```
