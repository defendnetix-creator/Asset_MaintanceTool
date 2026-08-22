#!/bin/bash
# Database Backup Script for Production
# Usage: ./scripts/backup.sh [full|incremental]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables
if [[ -f ".env" ]]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BACKUP_TYPE="${1:-full}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-assetmt}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_REGION="${BACKUP_S3_REGION:-us-east-1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*" -type f -mtime +$RETENTION_DAYS -delete
    log_info "Cleanup completed"
}

# Function to upload to S3
upload_to_s3() {
    local file="$1"
    if [[ -n "$S3_BUCKET" && -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
        log_info "Uploading $file to S3..."
        aws s3 cp "$file" "s3://$S3_BUCKET/backups/$(basename "$file")" --region "$S3_REGION"
        log_info "Upload completed"
    else
        log_warn "S3 backup not configured, skipping upload"
    fi
}

# Full backup using pg_dump
full_backup() {
    local filename="${BACKUP_PREFIX}_full_${TIMESTAMP}.sql.gz"
    local filepath="${BACKUP_DIR}/${filename}"
    
    log_info "Starting full database backup..."
    log_info "Output: $filepath"
    
    # Run pg_dump from postgres container
    docker exec assetmt-postgres pg_dump \
        -U "${POSTGRES_USER:-assetmt}" \
        -d "${POSTGRES_DB:-assetmt}" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > "$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    log_info "Full backup completed: $filename ($size)"
    
    upload_to_s3 "$filepath"
}

# Incremental backup using WAL (requires WAL archiving configured)
incremental_backup() {
    local filename="${BACKUP_PREFIX}_incremental_${TIMESTAMP}.tar.gz"
    local filepath="${BACKUP_DIR}/${filename}"
    
    log_info "Starting incremental backup (WAL archiving)..."
    log_info "Output: $filepath"
    
    # This requires WAL archiving to be configured in postgresql.conf
    # For now, we'll do a full backup as incremental is complex
    log_warn "Incremental backup not fully implemented, falling back to full backup"
    full_backup
}

# Main
case "${BACKUP_TYPE}" in
    full)
        full_backup
        ;;
    incremental)
        incremental_backup
        ;;
    *)
        log_error "Usage: $0 {full|incremental}"
        exit 1
        ;;
esac

cleanup_old_backups

log_info "Backup process completed successfully!"