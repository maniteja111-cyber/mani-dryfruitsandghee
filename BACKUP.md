# Database Backup and Recovery Guide

## Overview

This document describes the complete backup and recovery strategy for the MANI DRY FRUITS & GHEE STORE database. Following these procedures ensures data safety and enables quick recovery in case of data loss, corruption, or migration failures.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Creating a Backup](#creating-a-backup)
3. [Backup Verification](#backup-verification)
4. [Checksum Verification](#checksum-verification)
5. [Retention Policy](#retention-policy)
6. [Cloud Backup](#cloud-backup)
7. [Restoring from Backup](#restoring-from-backup)
8. [Health Checks](#health-checks)
9. [Automated Backups](#automated-backups)
10. [Recovery Procedures](#recovery-procedures)
11. [Emergency Checklist](#emergency-checklist)
12. [Backup Logs](#backup-logs)
13. [Best Practices](#best-practices)

---

## Quick Reference

```bash
# Create a backup
npm run backup

# Verify the latest backup
npm run verify-backup

# Restore from a backup
npm run restore

# Run pre-deployment checks
npm run deploy-check

# Run health check
npm run health-check
```

---

## Creating a Backup

### Manual Backup

Run the backup script:

```bash
npm run backup
```

**What it does:**
- Reads `DATABASE_URL` from `.env`
- Creates `backups/` directory if it doesn't exist
- Creates `logs/` directory if it doesn't exist
- Generates filename: `backup_YYYY-MM-DD_HH-MM.sql`
- Uses `mysqldump` to export the entire database including:
  - All table schemas
  - All data
  - Triggers
  - Stored routines
  - Events
- Verifies backup content:
  - File exists and is not empty
  - Contains CREATE TABLE statements
  - Contains INSERT statements
  - Database name matches DATABASE_URL
- Generates SHA256 checksum
- Writes checksum file: `backup_YYYY-MM-DD_HH-MM.sql.sha256`
- Generates `BACKUP_STATUS.md` report
- Cleans up old backups based on retention policy
- Optionally uploads to cloud storage
- Logs to `logs/backup.log`

**Output:**
```
🔄 Starting database backup...
   Database: u938537610_ManiDPGS
   Host: srv687.hstgr.io:3306
   File: backup_2026-07-08_22-45.sql
✅ Backup completed successfully
   File: backups/backup_2026-07-08_22-45.sql
   Size: 2.35 MB
   Tables: 25
   Data rows: 1543
   Checksum: abc123...
   Duration: 1234ms
```

### Backup Status Report

After every successful backup, a `BACKUP_STATUS.md` file is generated with:
- Latest backup details
- Retention policy information
- Verification status
- Cloud backup status
- Emergency recovery instructions

---

## Backup Verification

### Automatic Verification

Every backup is automatically verified after creation:
- ✅ SQL file exists
- ✅ File size > 0
- ✅ Contains CREATE TABLE statements
- ✅ Contains INSERT statements
- ✅ Database name matches DATABASE_URL

If any verification fails, the backup is deleted and the process exits with an error.

### Manual Verification

Run the verification script:

```bash
npm run verify-backup
```

**What it checks:**
- Backup file exists and is not empty
- SQL content is not empty
- `CREATE TABLE` statements exist
- `INSERT` statements exist
- Lists all tables in the backup
- Prints backup size and table count

**Output:**
```
🔍 Verifying backup...
   File: backup_2026-07-08_22-45.sql
   Size: 2.35 MB
   SQL content length: 456789 characters
   CREATE TABLE statements: 25
   INSERT statements: 1543

📋 Tables in backup:
   - users
   - products
   - orders
   - categories
   - ...

✅ Backup verification completed successfully
   Tables: 25
   Data rows: 1543
   Size: 2.35 MB
```

---

## Checksum Verification

### Checksum Generation

Every backup generates a SHA256 checksum file:
- File: `backup_YYYY-MM-DD_HH-MM.sql.sha256`
- Content: `<checksum>  <filename>`

### Checksum Verification During Restore

Before restoring, the restore script automatically verifies the checksum:
- Compares stored checksum with actual file checksum
- If checksums don't match, restore is aborted
- Prevents restoring corrupted backups

**Output:**
```
🔍 Verifying backup integrity...
✅ Checksum verified
```

---

## Retention Policy

Old backups are automatically deleted based on age:

| Backup Type | Retention Period | Description |
|-------------|------------------|-------------|
| Daily | 30 days | Recent backups |
| Weekly | 12 weeks (84 days) | Older backups |
| Monthly | 12 months (365 days) | Oldest backups |

**Rules:**
- The newest backup is **never deleted**
- Backups older than 12 months are always deleted
- Checksum files are deleted along with their backups

**Example:**
- Daily backups older than 30 days are deleted
- Weekly backups older than 12 weeks are deleted
- Monthly backups older than 12 months are deleted

---

## Cloud Backup

### Supported Providers

- Google Drive
- OneDrive
- Dropbox

### Configuration

Set these environment variables in `.env`:

```env
# Cloud backup provider: google-drive, onedrive, or dropbox
CLOUD_BACKUP_PROVIDER=google-drive

# Google Drive
GOOGLE_DRIVE_ACCESS_TOKEN=your-access-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# OneDrive
ONEDRIVE_ACCESS_TOKEN=your-access-token
ONEDRIVE_FOLDER_PATH=/backups

# Dropbox
DROPBOX_ACCESS_TOKEN=your-access-token
DROPBOX_PATH=/backups
```

### Usage

Cloud backup happens automatically after every successful backup if `CLOUD_BACKUP_PROVIDER` is set.

**Example output:**
```
☁️  Uploading to google-drive...
   ✅ Uploaded to Google Drive
```

If the provider is not configured, cloud upload is skipped silently.

---

## Restoring from Backup

### Automatic Checksum Verification

Before restoring, the script automatically:
1. Verifies the checksum file exists
2. Computes the SHA256 hash of the backup file
3. Compares with the stored checksum
4. Aborts if checksums don't match

### Manual Restore

Run the restore script:

```bash
npm run restore
```

**What it does:**
1. Lists all available backups in `backups/` directory
2. Prompts you to select a backup by number
3. Asks for explicit confirmation (`YES`)
4. Verifies backup checksum
5. Restores the selected backup
6. Verifies all tables exist after restore
7. Prints row counts for every table
8. Logs restore operation to `logs/restore.log`

**Output:**
```
📦 Available backups:
   1. backup_2026-07-08_22-45.sql (2.35 MB)
   2. backup_2026-07-08_14-30.sql (2.31 MB)
   3. backup_2026-07-07_09-15.sql (2.28 MB)

Enter backup number to restore: 1

⚠️  WARNING: This will REPLACE all data in database "u938537610_ManiDPGS"
   Backup file: backup_2026-07-08_22-45.sql
Type "YES" to confirm: YES

🔍 Verifying backup integrity...
✅ Checksum verified

🔄 Restoring database...
✅ Database restored successfully

📊 Verifying tables...
   Found 25 tables

📈 Row counts:
   - users: 5
   - products: 42
   - orders: 128
   - categories: 3
   - ...

✅ Restore completed successfully
```

### Restore from Specific File

If you need to restore from a specific file not listed:

```bash
# For .sql files
mysql -u username -p database_name < backups/backup_YYYY-MM-DD_HH-MM.sql

# For .sql.gz files
gunzip < backups/backup_YYYY-MM-DD_HH-MM.sql.gz | mysql -u username -p database_name
```

---

## Health Checks

### Post-Deployment Health Check

After deployment, run the health check:

```bash
npm run health-check
```

**Checks performed:**
1. ✅ Database connection
2. ✅ Products table accessible
3. ✅ Categories table accessible
4. ✅ Settings table accessible
5. ✅ Admin user exists (phone: 9999999999)
6. ✅ Home page HTTP 200
7. ✅ Products page HTTP 200
8. ✅ API /products HTTP 200
9. ✅ API /settings HTTP 200

**Output:**
```
🏥 Running post-deployment health checks...

✅ Database Connection: Successfully connected to database (45ms)
✅ Products Table: Products table accessible, 42 products found (12ms)
✅ Categories Table: Categories table accessible, 3 categories found (8ms)
✅ Settings Table: Settings table accessible, 12 settings found (6ms)
✅ Admin User: Admin user found (ID: user_123) (15ms)
✅ Home Page: HTTP 200 - OK (234ms)
✅ Products Page: HTTP 200 - OK (567ms)
✅ API /products: HTTP 200 - OK (123ms)
✅ API /settings: HTTP 200 - OK (45ms)

✅ All health checks passed
Deployment successful!
```

**If any check fails:**
```
❌ Health checks failed:
   - Products Table: Connection timeout
   - Home Page: HTTP 500 - Internal Server Error

Deployment failed. Fix the issues above and retry.
```

### Pre-Deployment Checks

Run before deployment:

```bash
npm run deploy-check
```

**Checks performed:**
1. ✅ Database backup created
2. ✅ Prisma schema validated
3. ✅ Prisma Client generated
4. ✅ Prisma migrate status clean
5. ✅ Post-deployment health check

If any check fails, deployment is **cancelled immediately**.

---

## Automated Backups

### Pre-Migration Backups

**Every Prisma migration automatically creates a backup before proceeding.**

```bash
# Safe migration (backup happens automatically)
npm run pre-migrate && npx prisma migrate deploy
```

**Safety features:**
- Backup is created **before** any migration runs
- If backup fails, migration is **aborted**
- Migration continues only if backup succeeds
- Backup filename includes timestamp for easy identification

### Before Deployment

Always run the deployment check before deploying to production:

```bash
npm run deploy-check
```

**What it verifies:**
1. ✅ Database backup created
2. ✅ Prisma schema validated
3. ✅ Prisma Client generated
4. ✅ Migration status verified
5. ✅ Post-deployment health checks passed

**If any check fails:**
- Deployment is cancelled
- Error details are displayed
- Fix the issue before retrying

---

## Recovery Procedures

### Scenario 1: Accidental Data Deletion

**Symptoms:**
- Products or orders missing
- Users deleted
- Categories removed

**Recovery steps:**
1. Identify when the data was lost
2. Find the most recent backup before the incident:
   ```bash
   ls -lt backups/
   ```
3. Verify the backup:
   ```bash
   npm run verify-backup
   ```
4. Restore the backup:
   ```bash
   npm run restore
   ```
5. Select the appropriate backup
6. Type `YES` to confirm

**Time to recovery:** ~5 minutes

---

### Scenario 2: Migration Failure

**Symptoms:**
- Migration error during deployment
- Database schema corrupted
- Application crashes after migration

**Recovery steps:**
1. **Do not panic** - a pre-migration backup was automatically created
2. Check the backups directory:
   ```bash
   ls -lt backups/
   ```
3. Restore the most recent backup:
   ```bash
   npm run restore
   ```
4. Select the backup created before the failed migration
5. Investigate the migration issue
6. Fix the migration script
7. Retry deployment

**Time to recovery:** ~5 minutes

---

### Scenario 3: Complete Database Loss

**Symptoms:**
- Database server down
- Database corrupted
- Accidental DROP DATABASE

**Recovery steps:**
1. Create a new empty database
2. Update `DATABASE_URL` in `.env` if needed
3. Find the most recent backup:
   ```bash
   ls -lt backups/
   ```
4. Verify the backup:
   ```bash
   npm run verify-backup
   ```
5. Restore the backup:
   ```bash
   npm run restore
   ```
6. Run Prisma migrations if needed:
   ```bash
   npx prisma migrate deploy
   ```
7. Verify the application:
   ```bash
   npm run build
   npm start
   ```

**Time to recovery:** ~10 minutes

---

### Scenario 4: Need to Rollback Migration

**Symptoms:**
- Migration introduced bugs
- Need to revert to previous schema

**Recovery steps:**
1. Create a backup of current state (optional but recommended):
   ```bash
   npm run backup
   ```
2. Restore the pre-migration backup:
   ```bash
   npm run restore
   ```
3. Select the backup from before the migration
4. Verify the application works:
   ```bash
   npm run build
   ```

**Time to recovery:** ~5 minutes

---

## Emergency Checklist

If you encounter a database emergency, follow this checklist:

### Immediate Actions (First 5 minutes)

- [ ] **STOP** - Do not run any more migrations or database commands
- [ ] **ASSESS** - Identify what went wrong and when
- [ ] **BACKUP** - If the database is still accessible, create an emergency backup:
  ```bash
  npm run backup
  ```
- [ ] **NOTIFY** - Alert team members if applicable

### Recovery Actions (Next 10 minutes)

- [ ] **LIST BACKUPS** - Find available backups:
  ```bash
  ls -lt backups/
  ```

- [ ] **VERIFY BACKUP** - Ensure the backup is valid:
  ```bash
  npm run verify-backup
  ```

- [ ] **RESTORE** - Restore the most recent valid backup:
  ```bash
  npm run restore
  ```

- [ ] **VERIFY RESTORE** - Check that tables and data are restored:
  ```bash
  npm run build
  ```

- [ ] **TEST APPLICATION** - Start the application and verify functionality:
  ```bash
  npm start
  ```

### Post-Recovery Actions (Next 30 minutes)

- [ ] **INVESTIGATE** - Determine root cause of the issue
- [ ] **DOCUMENT** - Document what happened and how it was resolved
- [ ] **PREVENT** - Implement measures to prevent recurrence
- [ ] **MONITOR** - Monitor the application for 24 hours

---

## Backup Logs

All backup operations are logged to `logs/backup.log`.

**Log format:**
```
[2026-07-08T22:45:00.000Z] SUCCESS: backup_2026-07-08_22-45.sql (2.35 MB, 25 tables, 1543 rows, 1234ms)
[2026-07-08T22-45:00.000Z] DELETED: backup_2026-06-08_14-30.sql (retention policy)
[2026-07-08T14:30:00.000Z] FAILED: Verification failed - No INSERT statements found (duration: 500ms)
```

**Log contents:**
- Timestamp
- Status (SUCCESS, FAILED, DELETED)
- Backup filename
- File size
- Table count
- Row count
- Duration
- Error messages (if any)

## Restore Logs

All restore operations are logged to `logs/restore.log`.

**Log format:**
```
[2026-07-08T22:50:00.000Z] STARTED: Restoring from backup_2026-07-08_22-45.sql
[2026-07-08T22:50:05.000Z] SUCCESS: Restored from backup_2026-07-08_22-45.sql
[2026-07-08T22:48:00.000Z] FAILED: Checksum verification failed for backup_2026-07-08_22-45.sql
[2026-07-08T22:45:00.000Z] CANCELLED: User did not confirm
```

---

## Backup Storage

### Local Backups

Backups are stored in the `backups/` directory in the project root.

**Retention policy:**
- Daily backups: Keep for 30 days
- Weekly backups: Keep for 12 weeks
- Monthly backups: Keep for 12 months
- The newest backup is never deleted

**Automatic cleanup:**
Old backups are automatically deleted after each backup based on the retention policy.

**Manual cleanup:**
```bash
# Delete backups older than 30 days (manual fallback)
find backups/ -name "backup_*.sql*" -mtime +30 -delete
```

### Remote Backups (Recommended)

For production safety, copy backups to a remote location:

```bash
# Copy to remote server
scp backups/backup_*.sql user@backup-server:/backups/database/

# Or upload to cloud storage
# AWS S3
aws s3 cp backups/ s3://my-bucket/backups/ --recursive

# Google Cloud Storage
gsutil cp -r backups/ gs://my-bucket/backups/
```

### Cloud Backup Configuration

Enable automatic cloud backup by setting environment variables:

```env
# Cloud backup provider
CLOUD_BACKUP_PROVIDER=google-drive

# Google Drive
GOOGLE_DRIVE_ACCESS_TOKEN=your-access-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# OneDrive
ONEDRIVE_ACCESS_TOKEN=your-access-token
ONEDRIVE_FOLDER_PATH=/backups

# Dropbox
DROPBOX_ACCESS_TOKEN=your-access-token
DROPBOX_PATH=/backups
```

---

## Best Practices

### 1. Backup Frequency

- **Before every migration** (automatic)
- **Before every deployment** (automatic)
- **Daily** for production databases
- **Before major changes** (manual)

### 2. Backup Verification

- Always verify backups after creation:
  ```bash
  npm run backup && npm run verify-backup
  ```
- Check checksum files are present
- Verify backup logs for errors

### 3. Test Restores

- Test restore procedures monthly
- Verify backup integrity regularly
- Ensure restore process works in < 10 minutes
- Verify checksums during restore

### 4. Storage

- Store backups in multiple locations
- Use cloud backup for off-site safety
- Encrypt sensitive backups
- Maintain at least 30 days of history
- Keep at least one backup off-site

### 5. Documentation

- Document all database changes
- Keep a changelog of migrations
- Record backup and restore operations
- Maintain this guide and update as needed
- Review backup logs regularly

### 6. Safety Measures

- **Never** run `prisma migrate reset` on production
- **Never** run `prisma db push --force-reset` on production
- **Always** backup before migrations
- **Always** verify backups
- **Always** test migrations in staging first
- **Never** overwrite existing backups
- **Never** delete the newest backup

---

## Troubleshooting

### mysqldump Not Found

**Error:**
```
Failed to start mysqldump: spawn mysqldump ENOENT
```

**Solution:**
Install MySQL client tools and ensure `mysqldump` is in your PATH:

```bash
# Windows (using Chocolatey)
choco install mysql

# macOS
brew install mysql

# Ubuntu/Debian
sudo apt-get install mysql-client
```

### Permission Denied

**Error:**
```
Access denied for user 'user'@'host'
```

**Solution:**
Verify `DATABASE_URL` in `.env` has correct credentials and the user has sufficient privileges.

### Backup File Too Large

**Solution:**
Compress backups automatically or split into multiple files.

### Checksum Verification Failed

**Error:**
```
❌ Checksum verification failed
   Expected: abc123...
   Actual:   def456...
```

**Solution:**
- The backup file may be corrupted
- Try restoring from a different backup
- Verify the backup file wasn't modified
- Check disk for errors

### Restore Fails

**Error:**
```
MySQL command failed
```

**Solution:**
1. Check MySQL server is running
2. Verify database exists
3. Check user permissions
4. Review error message for specific SQL errors
5. Verify backup file is not corrupted
6. Verify checksum matches

---

## Scripts Reference

### backup-db.ts

Creates a timestamped backup of the entire database with verification, checksums, and cloud upload.

**Usage:**
```bash
npm run backup
# or
npx tsx scripts/backup-db.ts
```

**Output:** `backups/backup_YYYY-MM-DD_HH-MM.sql` + `.sha256` + `BACKUP_STATUS.md`

**Features:**
- Automatic content verification
- SHA256 checksum generation
- Retention policy enforcement
- Cloud backup support
- Backup logging
- Status report generation

---

### restore-db.ts

Restores a database from a selected backup with checksum verification.

**Usage:**
```bash
npm run restore
# or
npx tsx scripts/restore-db.ts
```

**Interactive prompts:**
1. Select backup number
2. Confirm with `YES`

**Features:**
- Checksum verification before restore
- Table verification after restore
- Row count reporting
- Restore logging

---

### verify-backup.ts

Verifies the integrity of the most recent backup.

**Usage:**
```bash
npm run verify-backup
# or
npx tsx scripts/verify-backup.ts
```

**Checks:**
- File exists and is not empty
- SQL content is valid
- CREATE TABLE statements present
- INSERT statements present
- Lists all tables

---

### health-check.ts

Runs post-deployment health checks.

**Usage:**
```bash
npm run health-check
# or
npx tsx scripts/health-check.ts
```

**Checks:**
1. Database connection
2. Products table
3. Categories table
4. Settings table
5. Admin user
6. Home page
7. Products page
8. API /products
9. API /settings

---

### pre-migrate.ts

Automatically creates a backup before Prisma migrations.

**Usage:**
```bash
npm run pre-migrate
# or
npx tsx scripts/pre-migrate.ts
```

**Used automatically before:**
- `npx prisma migrate dev`
- `npx prisma migrate deploy`

**Safety:** If backup fails, migration is aborted.

---

### deploy-check.ts

Runs all pre-deployment safety checks.

**Usage:**
```bash
npm run deploy-check
# or
npx tsx scripts/deploy-check.ts
```

**Checks:**
1. Database backup
2. Prisma validate
3. Prisma generate
4. Prisma migrate status
5. Post-deployment health check

---

## Environment Variables

### Required

```env
DATABASE_URL=mysql://user:password@host:port/database
```

### Optional (Cloud Backup)

```env
# Cloud backup provider
CLOUD_BACKUP_PROVIDER=google-drive

# Google Drive
GOOGLE_DRIVE_ACCESS_TOKEN=your-access-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# OneDrive
ONEDRIVE_ACCESS_TOKEN=your-access-token
ONEDRIVE_FOLDER_PATH=/backups

# Dropbox
DROPBOX_ACCESS_TOKEN=your-access-token
DROPBOX_PATH=/backups
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review backup logs in `logs/backup.log`
3. Review restore logs in `logs/restore.log`
4. Verify `.env` configuration
5. Test with `npm run verify-backup`
6. Consult Prisma documentation: https://www.prisma.io/docs

---

**Last Updated:** 2026-07-08  
**Version:** 2.0  
**Maintained by:** MANI DRY FRUITS & GHEE STORE Team
