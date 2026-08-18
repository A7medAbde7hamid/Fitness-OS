# Staging Approval — v1.0.0-rc.1

**Version**: 1.0.0-rc.1
**Date**: August 18, 2026
**Status**: STAGING BLOCKED (pending real deployment)

---

## Deployment Information

| Field | Value |
|-------|-------|
| RC Version | 1.0.0-rc.1 |
| Staging URL | [NOT YET DEPLOYED] |
| Deployment Commit | [pending] |
| Deployment Time | [pending] |
| Supabase Project | [pending] |
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
| Deployment scripts | CREATED | deploy.ts, migrate.ts, post-deploy.ts |

---

## Deployment Steps

### 1. Create Staging Supabase Project

```bash
# Create a new Supabase project (separate from production)
# Project name: ai-fitness-os-staging
# Region: same as intended production
```

### 2. Apply Migrations

```bash
# Set staging credentials
export SUPABASE_URL=https://<staging-project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>

# Run migrations
npx tsx scripts/migrate.ts
```

### 3. Configure Environment Variables

Set these in your deployment platform (Vercel, Netlify, Cloud Run, etc.):

```bash
# Required
SUPABASE_URL=https://<staging-project>.supabase.co
SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
VITE_SUPABASE_URL=https://<staging-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
GEMINI_API_KEY=<gemini-key>

# Staging-specific
WHATSAPP_PROVIDER=mock
RATE_LIMIT_ENABLED=true
APP_URL=https://staging.yourdomain.com
NODE_ENV=production
```

### 4. Deploy Application

```bash
# Build and deploy
npx tsx scripts/deploy.ts --env staging

# Or manually
npm run build
# Deploy dist/ to your platform
```

### 5. Run Validation

```bash
# Set staging URL
export STAGING_URL=https://staging.yourdomain.com

# Run validation script
npx tsx scripts/validate-staging.ts

# Run post-deploy checks
npx tsx scripts/post-deploy.ts --url=$STAGING_URL

# Run E2E tests
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
| No API keys in client | [ ] PENDING | - |

### Database

| Check | Status | Notes |
|-------|--------|-------|
| Schema matches | [ ] PENDING | - |
| RLS policies active | [ ] PENDING | - |
| Indexes exist | [ ] PENDING | - |
| No production data | [ ] PENDING | - |
| Migrations applied | [ ] PENDING | - |

### AI

| Check | Status | Notes |
|-------|--------|-------|
| Normal question | [ ] PENDING | - |
| Tool execution | [ ] PENDING | - |
| Image analysis | [ ] PENDING | - |
| Timeout handling | [ ] PENDING | - |
| No client-side keys | [ ] PENDING | - |

### WhatsApp

| Check | Status | Notes |
|-------|--------|-------|
| Webhook verification | [ ] PENDING | - |
| Text message | [ ] PENDING | - |
| Image message | [ ] PENDING | - |
| Duplicate handling | [ ] PENDING | - |
| Arabic reply | [ ] PENDING | - |
| English reply | [ ] PENDING | - |

### PWA

| Check | Status | Notes |
|-------|--------|-------|
| manifest.json | [ ] PENDING | - |
| Service worker | [ ] PENDING | - |
| Offline fallback | [ ] PENDING | - |
| Install prompt | [ ] PENDING | - |
| Icons | [ ] PENDING | - |

### Performance

| Metric | Value | Target |
|--------|-------|--------|
| Initial load | [ ] PENDING | < 3s |
| Dashboard load | [ ] PENDING | < 2s |
| AI response | [ ] PENDING | < 10s |
| Health latency | [ ] PENDING | < 500ms |

---

## Manual QA Checklist

### Viewports

| Viewport | EN | AR | Notes |
|----------|----|----|-------|
| 375x812 (iPhone X) | [ ] | [ ] | - |
| 390x844 (iPhone 12) | [ ] | [ ] | - |
| 414x896 (iPhone 11) | [ ] | [ ] | - |
| Desktop | [ ] | [ ] | - |

### Features

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | [ ] PENDING | - |
| Auth flow | [ ] PENDING | - |
| Dashboard | [ ] PENDING | - |
| Weight logging | [ ] PENDING | - |
| Meal logging | [ ] PENDING | - |
| Activity logging | [ ] PENDING | - |
| Progress charts | [ ] PENDING | - |
| AI Coach | [ ] PENDING | - |
| WhatsApp linking | [ ] PENDING | - |
| Arabic RTL | [ ] PENDING | - |
| English LTR | [ ] PENDING | - |
| Keyboard nav | [ ] PENDING | - |
| Bottom navigation | [ ] PENDING | - |
| Modals | [ ] PENDING | - |
| Offline banner | [ ] PENDING | - |
| Sync state | [ ] PENDING | - |
| Error states | [ ] PENDING | - |

---

## Known Issues

| Issue | Severity | Workaround | Status |
|-------|----------|------------|--------|
| None identified | - | - | - |

---

## Approval

| Gate | Status | Verified By | Date |
|------|--------|-------------|------|
| Pre-deployment checks | PASS | automated | 2026-08-18 |
| Deployment | [ ] PENDING | - | - |
| Health endpoints | [ ] PENDING | - | - |
| E2E tests | [ ] PENDING | - | - |
| Security checks | [ ] PENDING | - | - |
| AI verification | [ ] PENDING | - | - |
| WhatsApp sandbox | [ ] PENDING | - | - |
| Offline sync | [ ] PENDING | - | - |
| PWA validation | [ ] PENDING | - | - |
| Manual QA | [ ] PENDING | - | - |
| Performance | [ ] PENDING | - | - |

---

## FINAL STATUS

**STAGING BLOCKED**

Reason: Real staging environment not yet deployed. All validation tooling is ready. A human must:

1. Create a staging Supabase project
2. Apply migrations
3. Deploy to a hosting platform
4. Configure environment variables
5. Run the validation commands
6. Complete the manual QA checklist
7. Update this document with results
8. Change status to STAGING APPROVED (if all pass) or keep STAGING BLOCKED

---

## Appendix: Validation Commands

```bash
# Full validation
npx tsx scripts/validate-staging.ts

# Post-deploy checks
npx tsx scripts/post-deploy.ts --url=https://staging.yourdomain.com

# E2E tests
STAGING_URL=https://staging.yourdomain.com npx playwright test --config=playwright.staging.config.ts

# Health checks
curl -f https://staging.yourdomain.com/health
curl -f https://staging.yourdomain.com/health/db
curl -f https://staging.yourdomain.com/health/ai
curl -f https://staging.yourdomain.com/health/whatsapp
```
