# Runbook: Rollback Database Migration

**Last Updated:** November 16, 2025  
**Database:** PostgreSQL (Supabase)  
**ORM:** Prisma

---

## ⚠️ WARNING

**Database rollbacks can cause data loss. Always:**
- ✅ Backup database before migration
- ✅ Test rollback in staging first
- ✅ Coordinate with team
- ✅ Have rollback plan ready

---

## Overview

This runbook covers the process of rolling back a Prisma database migration that has been applied to production.

---

## Prerequisites

- ✅ Database backup created
- ✅ Access to production database
- ✅ Prisma CLI installed
- ✅ Migration files available locally
- ✅ Team notified of rollback

---

## Pre-Rollback Checklist

- [ ] Identify migration to rollback
- [ ] Review migration SQL to understand impact
- [ ] Check for dependent migrations
- [ ] Backup production database
- [ ] Notify team of rollback window
- [ ] Prepare rollback SQL script (if needed)

---

## Rollback Methods

### Method 1: Prisma Migrate Reset (⚠️ DESTRUCTIVE)

**Use only in development/staging or when data loss is acceptable.**

```bash
# 1. Navigate to backend directory
cd apps/backend

# 2. Reset database to specific migration
npx prisma migrate reset --force

# 3. Apply migrations up to desired point
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

**⚠️ WARNING:** This deletes all data!

---

### Method 2: Manual SQL Rollback (Recommended)

**Create a rollback migration that reverses changes.**

#### Step 1: Identify Migration to Rollback

```bash
# List applied migrations
cd apps/backend
npx prisma migrate status

# Output shows:
# Migration Name          Status
# 20251116000000_add_shopify_install    Applied
# 20251117000000_add_widget_table       Applied
```

#### Step 2: Review Migration SQL

```bash
# View migration SQL
cat prisma/migrations/20251117000000_add_widget_table/migration.sql
```

#### Step 3: Create Rollback Migration

```bash
# Create new migration file
npx prisma migrate dev --create-only --name rollback_widget_table

# Edit the generated migration file
# prisma/migrations/YYYYMMDDHHMMSS_rollback_widget_table/migration.sql
```

**Example Rollback SQL:**

```sql
-- Rollback: Remove widget_table
-- Original migration: 20251117000000_add_widget_table

-- Drop foreign key constraints first
ALTER TABLE "WidgetInstall" DROP CONSTRAINT IF EXISTS "WidgetInstall_shopDomain_fkey";
ALTER TABLE "WidgetInstall" DROP CONSTRAINT IF EXISTS "WidgetInstall_brandId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "WidgetInstall_shopDomain_idx";
DROP INDEX IF EXISTS "WidgetInstall_brandId_idx";

-- Drop table
DROP TABLE IF EXISTS "WidgetInstall";
```

#### Step 4: Apply Rollback Migration

```bash
# Apply rollback migration
npx prisma migrate deploy

# Verify rollback
npx prisma migrate status
```

---

### Method 3: Supabase Dashboard (Manual)

For Supabase-hosted databases:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "Database" → "Migrations"

2. **Create Rollback SQL**
   - Click "New Migration"
   - Paste rollback SQL
   - Name it: `rollback_YYYYMMDD_description`

3. **Review and Apply**
   - Review SQL carefully
   - Click "Apply Migration"

4. **Verify**
   - Check migration status
   - Verify schema changes

---

## Step-by-Step Rollback Process

### 1. Backup Database

```bash
# Create backup before rollback
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase CLI
supabase db dump -f backup.sql
```

### 2. Identify Target Migration

```bash
# Check current migration status
cd apps/backend
npx prisma migrate status

# Note the migration you want to rollback TO
# Example: Rollback TO migration "20251116000000_add_shopify_install"
```

### 3. Create Rollback Script

**For simple migrations (add table):**

```sql
-- Rollback: Remove table
DROP TABLE IF EXISTS "NewTable" CASCADE;
```

**For complex migrations (alter table):**

```sql
-- Rollback: Restore previous schema
ALTER TABLE "Users" 
  DROP COLUMN IF EXISTS "newColumn",
  ADD COLUMN IF NOT EXISTS "oldColumn" TEXT;
```

**For data migrations:**

```sql
-- Rollback: Restore previous data
-- (May require manual data restoration from backup)
UPDATE "Table" SET "column" = "previous_value" WHERE condition;
```

### 4. Test Rollback (Staging First!)

```bash
# 1. Apply rollback to staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 2. Verify application works
# 3. Run tests
npm run test

# 4. If successful, proceed to production
```

### 5. Apply Rollback to Production

```bash
# 1. Set production database URL
export DATABASE_URL=$PRODUCTION_DATABASE_URL

# 2. Apply rollback migration
npx prisma migrate deploy

# 3. Verify rollback
npx prisma migrate status
```

### 6. Update Prisma Schema (if needed)

```bash
# If rollback changes schema, update schema.prisma
# Then create new migration to sync
npx prisma migrate dev --name sync_after_rollback
```

---

## Troubleshooting

### Issue: Migration Already Applied

**Symptoms:**
- Error: "Migration already applied"
- Cannot rollback

**Solution:**
```bash
# Mark migration as rolled back manually
npx prisma migrate resolve --rolled-back 20251117000000_add_widget_table

# Then apply rollback migration
npx prisma migrate deploy
```

---

### Issue: Foreign Key Constraints

**Symptoms:**
- Error: "Cannot drop table, foreign key constraint exists"

**Solution:**
```sql
-- Drop constraints first
ALTER TABLE "ChildTable" DROP CONSTRAINT IF EXISTS "ChildTable_parentId_fkey";

-- Then drop table
DROP TABLE IF EXISTS "ParentTable" CASCADE;
```

---

### Issue: Data Loss Risk

**Symptoms:**
- Migration contains data transformations
- Rollback may lose data

**Solution:**
1. **Export data before rollback:**
   ```sql
   COPY (SELECT * FROM "Table") TO '/tmp/backup.csv' CSV HEADER;
   ```

2. **Create data restoration script:**
   ```sql
   -- Restore data after rollback
   COPY "Table" FROM '/tmp/backup.csv' CSV HEADER;
   ```

3. **Test restoration in staging first**

---

## Best Practices

### 1. Always Backup First

```bash
# Automated backup script
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
echo "Backup created: $BACKUP_FILE"
```

### 2. Test in Staging

- Always test rollback in staging environment first
- Verify application functionality after rollback
- Run full test suite

### 3. Document Rollback Plan

- Document rollback steps before migration
- Include SQL scripts in migration folder
- Update team documentation

### 4. Coordinate Rollback

- Notify team before rollback
- Schedule maintenance window if needed
- Have rollback plan ready before migration

---

## Rollback Scenarios

### Scenario 1: Recent Migration (No Data Impact)

**Migration:** Added new table, no data yet

**Rollback:**
```sql
DROP TABLE IF EXISTS "NewTable" CASCADE;
```

**Risk:** Low (no data to lose)

---

### Scenario 2: Schema Change (Data Impact)

**Migration:** Added column, populated with data

**Rollback:**
```sql
-- Backup data first
CREATE TABLE "BackupTable" AS SELECT * FROM "Table";

-- Rollback schema
ALTER TABLE "Table" DROP COLUMN "newColumn";

-- Restore if needed
-- INSERT INTO "Table" SELECT * FROM "BackupTable";
```

**Risk:** Medium (data may need restoration)

---

### Scenario 3: Complex Migration (High Risk)

**Migration:** Multiple tables, relationships, data transformations

**Rollback:**
1. Full database backup
2. Create comprehensive rollback script
3. Test thoroughly in staging
4. Coordinate with team
5. Execute during maintenance window

**Risk:** High (requires careful planning)

---

## Monitoring After Rollback

### 1. Verify Schema

```bash
# Check schema matches expected state
npx prisma db pull
npx prisma generate

# Compare with expected schema
```

### 2. Check Application Health

```bash
# Health check endpoint
curl https://api.luneo.app/health

# Check database connectivity
curl https://api.luneo.app/health/db
```

### 3. Monitor Error Logs

```bash
# Watch for database errors
tail -f /var/log/luneo/backend.log | grep -i "database\|prisma\|migration"
```

---

## Related Documentation

- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Backup Guide](../../docs/operations/DATABASE_BACKUP.md)
- [Migration Best Practices](../../docs/development/MIGRATION_GUIDE.md)

---

**Runbook Maintained By:** Database Team  
**Last Review:** November 16, 2025  
**Next Review:** December 16, 2025
