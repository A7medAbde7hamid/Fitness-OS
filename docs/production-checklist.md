# Production Checklist

Use this checklist before any production deployment.

## Pre-Deployment

### Environment
- [ ] All environment variables configured in deployment platform
- [ ] No `.env` files committed to repository
- [ ] Supabase production project created
- [ ] Gemini API key configured server-side only
- [ ] WhatsApp Business API credentials configured (if using WhatsApp)
- [ ] Rate limiting enabled (`RATE_LIMIT_ENABLED=true`)
- [ ] Log level set to `warn` or `error`

### Database
- [ ] All migrations applied: `supabase/migrations/`
- [ ] RLS enabled on all user-owned tables
- [ ] Foreign keys verified
- [ ] Indexes verified for query performance
- [ ] Backup strategy configured (PITR if available)
- [ ] Service role key stored securely (not in client code)

### Security
- [ ] No hardcoded passwords, tokens, or API keys in source
- [ ] No secrets in `dist/` build output
- [ ] Auth requires Supabase JWT (demo mode disabled)
- [ ] All API endpoints have auth where required
- [ ] Rate limiting active on all endpoints
- [ ] Input validation on all write endpoints
- [ ] Error messages don't leak internals
- [ ] CORS configured for production domain
- [ ] Security headers enabled

### AI
- [ ] Gemini API key server-side only
- [ ] Request timeout configured (30s)
- [ ] Tool validation (Zod schemas) active
- [ ] Max tool iterations enforced
- [ ] Usage tracking enabled

### WhatsApp
- [ ] Webhook verification token configured
- [ ] Message deduplication active
- [ ] Media validation enabled
- [ ] Provider credentials secure
- [ ] Mock provider disabled in production

### PWA
- [ ] Service worker registered
- [ ] Manifest correct with production icons
- [ ] Offline fallback page working
- [ ] Cache versioning active
- [ ] Update mechanism working

## Deployment

- [ ] CI/CD pipeline passes (lint, test, build, security scan)
- [ ] Build artifacts uploaded
- [ ] Deployment to staging successful
- [ ] Post-deploy health check passes on staging
- [ ] Deployment to production successful
- [ ] Post-deploy health check passes on production

## Post-Deployment

### Verification
- [ ] Application loads in browser
- [ ] Authentication works (signup/login)
- [ ] AI Coach responds
- [ ] Data sync works
- [ ] WhatsApp webhook responds (if configured)
- [ ] Health endpoints return healthy
- [ ] No 5xx errors in logs

### Monitoring
- [ ] Structured logs flowing
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Database connections healthy

## Rollback Procedure

If issues are detected after deployment:

1. **Frontend**: Revert to previous build artifact
2. **Backend**: Redeploy previous server version
3. **Database**: Only if destructive migration was applied (see recovery-runbook.md)
4. **Verify**: Run health checks after rollback
5. **Incident**: Document what happened and create fix

## Sign-Off

| Item | Verified By | Date |
|------|-------------|------|
| All tests pass | | |
| Security scan clean | | |
| Staging deployment OK | | |
| Production deployment OK | | |
| Health checks pass | | |
| Monitoring active | | |
