# Staging Validation Guide

## Overview

Phase 8.5 validates the release candidate (v1.0.0-rc.1) in a real staging environment before production deployment.

## Prerequisites

1. **Staging Supabase Project**
   - Separate from production
   - All migrations applied
   - RLS enabled
   - Test data only

2. **Staging Deployment**
   - Frontend deployed to staging URL
   - Server/API running
   - Environment variables configured
   - HTTPS enabled

3. **Staging Secrets**
   - `GEMINI_API_KEY` (can use production key or separate)
   - `SUPABASE_URL` (staging project)
   - `SUPABASE_SERVICE_ROLE_KEY` (staging project)
   - `VITE_SUPABASE_URL` (staging project)
   - `VITE_SUPABASE_ANON_KEY` (staging project)
   - `WHATSAPP_PROVIDER=mock` (sandbox only)

## Validation Steps

### 1. Environment Validation

```bash
# Set staging URL
export STAGING_URL=https://staging.yourdomain.com

# Run validation script
npx tsx scripts/validate-staging.ts
```

### 2. Health Check

```bash
# Verify all health endpoints
curl -f $STAGING_URL/health
curl -f $STAGING_URL/health/db
curl -f $STAGING_URL/health/ai
curl -f $STAGING_URL/health/whatsapp
```

### 3. E2E Tests Against Staging

```bash
# Run all staging E2E tests
STAGING_URL=$STAGING_URL npx playwright test --config=playwright.staging.config.ts

# Run specific test suites
STAGING_URL=$STAGING_URL npx playwright test e2e/staging-health.spec.ts --config=playwright.staging.config.ts
STAGING_URL=$STAGING_URL npx playwright test e2e/staging-security.spec.ts --config=playwright.staging.config.ts
STAGING_URL=$STAGING_URL npx playwright test e2e/staging-full.spec.ts --config=playwright.staging.config.ts
STAGING_URL=$STAGING_URL npx playwright test e2e/staging-sync.spec.ts --config=playwright.staging.config.ts
```

### 4. Manual Verification

- [ ] Application loads in browser
- [ ] Landing page displays correctly
- [ ] Authentication works (signup/login)
- [ ] Dashboard loads with test data
- [ ] AI Coach responds to messages
- [ ] Meal logging works
- [ ] Progress charts display
- [ ] Arabic/RTL layout works
- [ ] Mobile responsive layout works
- [ ] PWA install prompt appears

### 5. Security Verification

- [ ] Missing JWT returns 401
- [ ] Invalid JWT returns 401
- [ ] Rate limiting active
- [ ] No secrets in client bundle
- [ ] Security headers present
- [ ] CORS policy correct

### 6. Database Verification

- [ ] Schema matches expected version
- [ ] RLS policies active
- [ ] Indexes exist
- [ ] No production data present
- [ ] Test data only

## Staging Test Data

### Creating Test Users

Use the application's signup flow to create test users:
- `test-en@example.com` (English)
- `test-ar@example.com` (Arabic)

### Test Data Guidelines

- Use fake data only
- No real personal information
- No real meal photos
- No production WhatsApp numbers
- Clean up after testing

## Known Issues

Document any known issues here:

| Issue | Severity | Status |
|-------|----------|--------|
| None identified | - | - |

## Approval Checklist

| Check | Verified By | Date |
|-------|-------------|------|
| All E2E tests pass | | |
| Auth flow works | | |
| Sync works | | |
| AI Coach works | | |
| WhatsApp sandbox works | | |
| Security checks pass | | |
| Health endpoints work | | |
| No production data | | |
| Performance acceptable | | |

## Staging URL

**URL**: https://staging.yourdomain.com
**Migration Version**: 20260818000000
**Deployment Commit**: [commit hash]
**Deployed**: [date]

## Next Steps

After staging approval:
1. Create production Supabase project
2. Apply migrations to production
3. Configure production environment
4. Deploy to production
5. Run post-deploy health checks
6. Monitor for 24 hours
