#!/bin/bash
# Production Prisma Migration Script
# Usage: ./scripts/migrate.sh [up|down|status|create]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check required env vars
if [[ -z "${DATABASE_URL:-}" ]]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
fi

case "${1:-up}" in
    up)
        log_info "Running database migrations..."
        npx prisma migrate deploy
        log_info "Migrations completed successfully"
        ;;
    down)
        log_warn "Rolling back last migration..."
        npx prisma migrate resolve --rolled-back "$(npx prisma migrate status --json | jq -r '.appliedMigrations[-1].migration_name')"
        log_info "Rollback completed"
        ;;
    status)
        log_info "Checking migration status..."
        npx prisma migrate status
        ;;
    create)
        if [[ -z "${2:-}" ]]; then
            log_error "Migration name required: ./scripts/migrate.sh create <migration_name>"
            exit 1
        fi
        log_info "Creating new migration: $2"
        npx prisma migrate dev --name "$2"
        log_info "Migration created. Run 'npx prisma generate' to update client."
        ;;
    generate)
        log_info "Generating Prisma client..."
        npx prisma generate
        log_info "Client generated successfully"
        ;;
    reset)
        log_warn "This will RESET the database! Are you sure? (y/N)"
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            log_info "Resetting database..."
            npx prisma migrate reset --force
            log_info "Database reset complete"
        else
            log_info "Reset cancelled"
        fi
        ;;
    seed)
        log_info "Seeding database..."
        npx prisma db seed
        log_info "Seeding complete"
        ;;
    *)
        echo "Usage: $0 {up|down|status|create|generate|reset|seed}"
        echo "  up       - Apply pending migrations (default)"
        echo "  down     - Rollback last migration"
        echo "  status   - Show migration status"
        echo "  create   - Create new migration (requires name)"
        echo "  generate - Generate Prisma client"
        echo "  reset    - Reset database (DANGEROUS)"
        echo "  seed     - Seed database with initial data"
        exit 1
        ;;
esac