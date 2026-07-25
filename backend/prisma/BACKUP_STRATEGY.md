# GroceNest Database Backup Strategy & Recovery Runbook

This document defines the automated daily database backup policy, secure storage requirements, 30-day retention rules, weekly automated restore verification procedures, and failure alerting for GroceNest PostgreSQL database.

---

## 1. Core Principles & Acceptance Criteria

1. **Automated Daily Backups**: Daily PostgreSQL database dumps are executed automatically via cron at 02:00 UTC (`daily-db-backup.sh`).
2. **Secure Storage**: Backup files are saved with restricted read/write permissions (`chmod 600`) in `backend/backups/daily/` and optionally pushed to encrypted Cloud Object Storage (`BACKUP_S3_BUCKET`).
3. **Weekly Automated Restore Testing**: Every Sunday at 03:00 UTC, the latest daily backup dump is automatically restored into an isolated test database (`grocenest_restore_test`) to verify schema and row count integrity (`verify-weekly-restore.sh`).
4. **Immediate Failure Alerting**: Any failure during backup generation, compression, storage, or restore testing immediately dispatches critical alerts to monitoring systems and configured webhooks (`BACKUP_ALERT_WEBHOOK_URL`).

---

## 2. Automated Daily Backup Runner (`daily-db-backup.sh`)

### Cron Configuration (Server / Container Host)
Add the following line to `crontab -e`:
```cron
# Run GroceNest Daily DB Backup at 02:00 UTC every day
0 2 * * * cd /var/www/GroceNest/backend && bash scripts/daily-db-backup.sh >> /var/log/grocenest_backup.log 2>&1
```

### Script Workflow:
1. **Connectivity Check**: Verifies `DATABASE_URL` is configured and accessible.
2. **Compressed Dump Generation**: Generates custom format PostgreSQL dump compressed with `gzip`:
   - File format: `backend/backups/daily/db_daily_YYYYMMDD_HHMMSS.sql.gz`
3. **Security Lockdown**: Enforces `chmod 600` read/write owner-only permissions on created backup files.
4. **Retention Pruning**: Scans backup directory and removes daily backup files older than **30 days**.
5. **Alerting on Error**: If `pg_dump` or compression fails, dispatches alert via webhook/monitoring and exits with non-zero code.

```bash
# Manual or NPM execution
npm run db:backup:daily
```

---

## 3. Weekly Automated Restore Verification (`verify-weekly-restore.sh`)

To ensure backups are not just created, but 100% restorable, automated restore testing executes weekly.

### Cron Configuration (Server / Container Host)
Add the following line to `crontab -e`:
```cron
# Run GroceNest Weekly Restore Verification at 03:00 UTC every Sunday
0 3 * * 0 cd /var/www/GroceNest/backend && bash scripts/verify-weekly-restore.sh >> /var/log/grocenest_restore_verify.log 2>&1
```

### Script Workflow:
1. **Locate Dump**: Identifies the latest daily backup snapshot from `backend/backups/daily/`.
2. **Isolated Database Restoration**: Creates temporary test database (`grocenest_restore_test`) and restores the dump file.
3. **Schema & Record Validation**: Queries restored database to verify table counts for:
   - `User` table records
   - `Store` table records
   - `Product` table records
   - `Order` table records
4. **Cleanup**: Drops temporary test database.
5. **Alerting on Error**: If restore fails or row counts fail verification, dispatches critical alert.

```bash
# Manual or NPM execution
npm run db:restore:weekly
```

---

## 4. Alerting Configuration

When backup or restore failure occurs, scripts emit log alerts and execute webhook POST requests if `BACKUP_ALERT_WEBHOOK_URL` is set.

### Environment Variables:
```env
BACKUP_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=s3://grocenest-db-backups-prod
```

---

## 5. Emergency Manual Restore Runbook

If production database recovery is required:

1. Identify target backup file in `backend/backups/daily/`.
2. Uncompress backup if `.gz`: `gunzip -k backend/backups/daily/db_daily_<TIMESTAMP>.sql.gz`
3. Restore database:
   ```bash
   psql "$DATABASE_URL" < backend/backups/daily/db_daily_<TIMESTAMP>.sql
   ```
4. Verify system integrity: `npm run test:smoke`
