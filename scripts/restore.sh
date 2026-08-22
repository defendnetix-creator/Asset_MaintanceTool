#!/bin/bash
# Database Restore Script for Production
# Usage: ./scripts/restore.sh <backup_file>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables
if [[ -f ".env" ]]; then
    export $(grep -v '^#' .env | xargs)
fi

BACKUP_FILE="${1:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ -z "$BACKUP_FILE" ]]; then
    log_error "Usage: $0 <backup_file>"
    log_info "Available backups in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"/assetmt_*.sql.gz 2>/dev/null || log_warn "No backups found"
    exit 1
fi

# Resolve full path
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_warn "This will REPLACE the current database. Are you sure? (y/N)"
read -r confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log_info "Restore cancelled"
    exit 0
fi

log_info "Starting database restore from: $BACKUP_FILE"

# Stop backend to prevent connections
log_info "Stopping backend service..."
docker compose stop backend

# Drop and recreate database
log_info "Dropping and recreating database..."
docker exec assetmt-postgres psql -U "${POSTGRES_USER:-assetmt}" -d postgres -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB:-assetmt}' AND pid <> pg_backend_pid();
    DROP DATABASE IF EXISTS ${POSTGRES_DB:-assetmt};
    CREATE DATABASE ${POSTGRES_DB:-assetmt} OWNER ${POSTGRES_USER:-assetmt};
"

# Restore from backup
log_info "Restoring database from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    zcat "$BACKUP_FILE" | docker exec -i assetmt-postgres psql -U "${POSTGRES_USER:-assetmt}" -d "${POSTGRES_DB:-assetmt}"
else
    cat "$BACKUP_FILE" | docker exec -i assetmt-postgres psql -U "${POSTGRES_USER:-assetmt}" -d "${POSTGRES_DB:-assetmt}"
fi

# Run migrations to ensure schema is up to date
log_info "Running database migrations..."
docker compose run --rm backend npx prisma migrate deploy

# Restart backend
log_info "Restarting backend service..."
docker compose start backend

log_info "Database restore completed successfully!"
log_info "Please verify the application is working correctly."