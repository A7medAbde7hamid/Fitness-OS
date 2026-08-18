# Security Runbook

## Security Architecture

### Authentication
- Supabase Auth with JWT tokens
- Demo mode for development only (disabled in production)
- Session management via Supabase
- Password requirements enforced by Supabase

### Authorization
- RLS policies on all user-owned tables
- `auth.uid() = user_id` pattern
- Server-side JWT validation on all API endpoints

### Data Protection
- No secrets in source code
- API keys server-side only (Gemini, Supabase service role)
- No PII in logs (hashed user IDs, masked IPs)
- HTTPS enforced in production

## Security Scans

### Pre-Commit
```bash
# Scan for secrets
npm run security:scan

# Manual scan
grep -r "DefaultPassword\|sk-\|rk-\|AKIA" src/ server/ --include="*.ts" --include="*.tsx"
```

### CI/CD
Automated scans run on every PR and before deployment.

### Manual Audit
```bash
# Check dist for leaked secrets
grep -r "DefaultPassword\|sk-\|rk-\|AKIA" dist/

# Check environment handling
grep -r "process.env" server/ | grep -v "test"

# Verify no demo mode in production
grep -r "signInDemo" src/services/auth.ts
```

## Incident Response

### 1. Secret Exposure
**Severity**: Critical
**Response**:
1. Rotate the exposed credential immediately
2. Check logs for unauthorized access
3. Review git history for when secret was added
4. Update all systems using the old credential
5. Document the incident

### 2. Unauthorized Access
**Severity**: High
**Response**:
1. Check RLS policies are enabled
2. Verify JWT validation on all endpoints
3. Review access logs
4. Rotate JWT signing keys if needed
5. Notify affected users if PII was accessed

### 3. SQL Injection / XSS
**Severity**: Critical
**Response**:
1. Verify Zod validation on all inputs
2. Check for raw SQL queries (should use Supabase client)
3. Review output encoding
4. Deploy fix immediately
5. Audit similar patterns across codebase

### 4. AI Prompt Injection
**Severity**: High
**Response**:
1. Review AI conversation logs
2. Verify tool validation (Zod schemas)
3. Check max tool iterations enforced
4. Update system prompt if needed
5. Monitor for recurring attempts

## Security Controls

| Control | Status | Location |
|---------|--------|----------|
| JWT validation | Active | server/middleware/auth.ts |
| Rate limiting | Active | server/middleware/rateLimit.ts |
| Input validation | Active | server/middleware/validation.ts |
| Security headers | Active | server/middleware/security.ts |
| RLS policies | Active | supabase/migrations/ |
| No hardcoded secrets | Verified | npm run security:scan |
| Structured logging | Active | server/observability.ts |
| Health endpoints | Active | server/health.ts |

## Regular Audits

### Weekly
- [ ] Review error logs for anomalies
- [ ] Check rate limiting triggers
- [ ] Verify backup integrity

### Monthly
- [ ] Run security scan
- [ ] Review access patterns
- [ ] Update dependencies
- [ ] Review RLS policies

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing (if applicable)
- [ ] Review and update this runbook
