#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP="$(date +'%Y%m%d-%H%M%S')"
BACKUP_ROOT="${BACKUP_ROOT:-backups}"
OUTPUT_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
DATABASE_URL="${DATABASE_URL:-}"
REDIS_URL="${REDIS_URL:-}"

mkdir -p "${OUTPUT_DIR}"

echo "💾 Backup started at ${TIMESTAMP}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "❌ DATABASE_URL is not defined. Aborting." >&2
  exit 1
fi

echo "→ Dumping PostgreSQL database"
PG_BACKUP_FILE="${OUTPUT_DIR}/postgres.sql.gz"
pg_dump --dbname="${DATABASE_URL}" | gzip > "${PG_BACKUP_FILE}"

if [[ -n "${REDIS_URL}" ]]; then
  echo "→ Dumping Redis snapshot"
  REDIS_BACKUP_FILE="${OUTPUT_DIR}/redis.rdb"
  redis-cli -u "${REDIS_URL}" --rdb "${REDIS_BACKUP_FILE}"
else
  echo "⚠️  REDIS_URL not set. Skipping Redis backup."
fi

echo "→ Archiving uploads (if present)"
UPLOADS_DIR="${UPLOADS_DIR:-apps/frontend/public/uploads}"
if [[ -d "${UPLOADS_DIR}" ]]; then
  tar -czf "${OUTPUT_DIR}/uploads.tar.gz" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"
else
  echo "   (no uploads directory found at ${UPLOADS_DIR})"
fi

echo "✅ Backup completed. Files stored in ${OUTPUT_DIR}"

