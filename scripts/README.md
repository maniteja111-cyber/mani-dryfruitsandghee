# Database Safety Guide

## Quick Start

### Daily Operations

```bash
# Create a backup
npm run backup

# Verify backup integrity
npm run verify-backup

# Restore from backup (if needed)
npm run restore
```

### Before Migrations

**Automatic backup is triggered before every Prisma migration:**

```bash
# Safe migration (backup happens automatically)
npm run pre-migrate && npx prisma migrate dev

# Or use the safe wrapper
npx tsx scripts/pre-migrate.ts
```

**What happens:**
1. Backup is created automatically
2. If backup succeeds → migration proceeds
3. If backup fails → migration is **aborted**

### Before Deployment

```bash
# Run all safety checks
npm run deploy-check
```

**Checks performed:**
1. ✅ Database backup created
2. ✅ Prisma schema validated
3. ✅ Prisma Client generated
4. ✅ Migration status verified

If any check fails → **deployment is cancelled**

---

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run backup` | Create timestamped database backup |
| `npm run restore` | Restore from selected backup |
| `npm run verify-backup` | Verify latest backup integrity |
| `npm run pre-migrate` | Auto-backup before migrations |
| `npm run deploy-check` | Pre-deployment safety checks |

---

## File Locations

- Backups: `backups/backup_YYYY-MM-DD_HH-MM.sql`
- Scripts: `scripts/*.ts`
- Documentation: `BACKUP.md`

---

## Emergency Recovery

1. **STOP** - Do not run more migrations
2. **BACKUP** - `npm run backup` (if database is accessible)
3. **RESTORE** - `npm run restore`
4. **SELECT** - Choose the most recent valid backup
5. **CONFIRM** - Type `YES`
6. **VERIFY** - `npm run build`

---

## Important Notes

- Backups are stored locally in `backups/` (gitignored)
- Never commit backup files to git
- Copy backups to remote storage for off-site safety
- Test restore procedures monthly
- Keep at least 30 days of backup history

---

## Requirements

- **mysqldump** - Required for backup/restore
  - Windows: Install MySQL Workbench or MySQL Shell
  - macOS: `brew install mysql`
  - Linux: `sudo apt-get install mysql-client`
- **mysql** - Required for restore operations
- **Node.js** - For running the scripts

---

## Support

See `BACKUP.md` for detailed documentation.
