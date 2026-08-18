# Database Backup & Recovery

## Backup Strategy

### Automated Backups (Supabase)

| Plan | Backup Frequency | Retention | PITR |
|------|-----------------|-----------|------|
| Free | Daily | 7 days | No |
| Pro | Daily | 14 days | Yes (7 days) |
| Team | Daily | 28 days | Yes (14 days) |
| Enterprise | Daily | Custom | Yes (30 days) |

### What's Backed Up

- All database tables (profiles, meals, activities, etc.)
- Row Level Security policies
- Database functions and triggers
- Storage objects (if using Supabase Storage)

### What's NOT Backed Up

- Environment variables (stored in deployment platform)
- API keys (stored in secrets manager)
- Application code (stored in git)

## Recovery Procedures

### Scenario 1: Accidental Data Deletion

**RPO**: 24 hours (daily backup) or 0 (PITR)
**RTO**: 5-30 minutes

1. Identify the timestamp before deletion
2. Go to Supabase Dashboard → Database → Backups
3. For PITR: Select "Point in Time Recovery"
4. Choose restore point
5. Confirm restoration
6. Verify data integrity

### Scenario 2: Schema Migration Failure

**RPO**: 0 (before migration)
**RTO**: 5 minutes

1. If migration partially applied: rollback manually
2. If migration fully applied but broke something: restore from backup
3. Fix the migration file
4. Re-apply

### Scenario 3: Corrupted Data

**RPO**: Depends on when corruption started
**RTO**: 15-60 minutes

1. Identify scope of corruption
2. Export non-corrupted data
3. Restore from backup
4. Re-import non-corrupted data
5. Verify integrity

### Scenario 4: Complete Database Loss

**RPO**: 24 hours
**RTO**: 30-60 minutes

1. Create new Supabase project
2. Apply all migrations from `supabase/migrations/`
3. Restore from latest backup
4. Update environment variables
5. Verify all services

## Backup Verification

### Weekly
- [ ] Verify backup exists in Supabase Dashboard
- [ ] Check backup size is reasonable
- [ ] Review backup logs for errors

### Monthly
- [ ] Perform test restore to staging
- [ ] Verify data integrity after restore
- [ ] Update recovery procedures if needed

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Document any issues found
- [ ] Update this runbook

## Migration Safety

### Safe Migrations
- Adding new columns (with defaults)
- Adding new tables
- Adding indexes
- Adding constraints (with validation)

### Dangerous Migrations
- Dropping columns
- Dropping tables
- Changing column types
- Adding NOT NULL constraints to existing data

### Expand/Contract Pattern

For dangerous migrations:

1. **Expand**: Add new column/table, migrate data
2. **Verify**: Test with new schema
3. **Contract**: Remove old column/table

```sql
-- Step 1: Expand
ALTER TABLE profiles ADD COLUMN display_name_new TEXT;
UPDATE profiles SET display_name_new = display_name;

-- Step 2: Verify (in application code)
-- Use display_name_new for reads

-- Step 3: Contract (after verification)
ALTER TABLE profiles DROP COLUMN display_name;
ALTER TABLE profiles RENAME COLUMN display_name_new TO display_name;
```

## Monitoring

Monitor backup health via:
- Supabase Dashboard → Database → Backups
- Supabase API: `GET /platform/database/backups`
- Alerts on backup failure
