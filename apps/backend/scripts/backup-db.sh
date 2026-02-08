#!/bin/bash
# Database Backup Script for Luneo Platform
# Run: ./scripts/backup-db.sh
# Cron: 0 */6 * * * /path/to/backup-db.sh

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/tmp/luneo-backups}"
BACKUP_FILE="luneo_backup_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Dump database
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

echo "[$(date)] Backup created: ${BACKUP_DIR}/${BACKUP_FILE}"

# Optional: Upload to cloud storage
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILE}"
  echo "[$(date)] Uploaded to S3: s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILE}"
fi

# Cleanup: Remove local backups older than 7 days
find "$BACKUP_DIR" -name "luneo_backup_*.sql.gz" -mtime +7 -delete

echo "[$(date)] Backup complete."
