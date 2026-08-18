# Recovery Runbook

## Backup Strategy

### Database (Supabase)
- **Daily backups**: Automatic via Supabase (retention depends on plan)
- **PITR**: Point-in-time recovery available on Pro plans
- **Migrations**: Version-controlled in `supabase/migrations/`

### Application
- **Build artifacts**: Stored in CI/CD (retention: 3 days)
- **Source code**: Git repository
- **Configuration**: Environment variables in deployment platform

## Recovery Procedures

### 1. Frontend Rollback

**Time to recover**: < 1 minute
**Data loss**: None

```bash
# Via deployment platform
# Revert to previous build artifact
# Or redeploy from previous git commit
git checkout <previous-commit>
npm run build
# Deploy
```

### 2. Backend Rollback

**Time to recover**: < 1 minute
**Data loss**: None

```bash
# Redeploy previous server version
git checkout <previous-commit>
npm run build
# Restart server
```

### 3. Database Recovery

**Time to recover**: 5-30 minutes
**Data loss**: Depends on RPO

#### From Backup (Supabase Dashboard)
1. Go to Supabase Dashboard → Database → Backups
2. Select backup point
3. Click "Restore"
4. Wait for restoration to complete
5. Verify data integrity

#### From PITR (Pro Plan)
1. Go to Supabase Dashboard → Database → Backups → PITR
2. Select timestamp to restore to
3. Confirm restoration
4. Verify data integrity

#### Manual Recovery
1. Identify affected tables
2. Run reverse migrations if needed
3. Restore from backup SQL dump
4. Verify foreign key constraints

### 4. WhatsApp Recovery

**Time to recover**: < 5 minutes
**Data loss**: Pending messages may be lost

1. Verify webhook endpoint is responding
2. Check WhatsApp Business API credentials
3. Test with mock provider first
4. Switch to cloud_api provider
5. Verify message delivery

## RPO and RTO

| Component | RPO | RTO |
|-----------|-----|-----|
| Frontend | 0 (git) | < 1 min |
| Backend | 0 (git) | < 1 min |
| Database | 24 hours (daily backup) | < 30 min |
| Database (PITR) | 0 (continuous) | < 15 min |
| WhatsApp | 0 (stateless) | < 5 min |

## Incident Checklist

- [ ] Identify the issue
- [ ] Determine affected components
- [ ] Choose recovery procedure
- [ ] Execute recovery
- [ ] Verify health checks pass
- [ ] Monitor for 30 minutes
- [ ] Document incident
- [ ] Create post-mortem if needed

## Contact Information

| Role | Contact | Responsibility |
|------|---------|----------------|
| On-call engineer | [your contact] | First response |
| Database admin | [your contact] | Database recovery |
| Security lead | [your contact] | Security incidents |

## Post-Incident

After recovery:
1. Verify all systems operational
2. Check error rates returned to normal
3. Review what happened
4. Update monitoring/alerting if needed
5. Update this runbook if procedures changed
6. Schedule post-mortem for significant incidents
