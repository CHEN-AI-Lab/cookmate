#!/bin/sh
set -e

# ============================================
# CookMate - Database Migration & Startup Script
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting CookMate entrypoint..."

# --------------------------------------------------
# Wait for PostgreSQL if DATABASE_URL is configured
# --------------------------------------------------
if echo "${DATABASE_URL:-}" | grep -q "postgres"; then
    log "PostgreSQL detected in DATABASE_URL. Waiting for database..."
    
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:password@host:port/dbname
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    DB_PORT=${DB_PORT:-5432}
    
    log "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
    
    RETRIES=30
    until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
        RETRIES=$((RETRIES - 1))
        if [ "$RETRIES" -le 0 ]; then
            log "ERROR: PostgreSQL did not become available in time"
            exit 1
        fi
        log "PostgreSQL not ready yet, retrying... ($RETRIES attempts left)"
        sleep 2
    done
    
    log "PostgreSQL is ready!"
fi

# --------------------------------------------------
# Run Prisma database migrations
# --------------------------------------------------
log "Running Prisma migrations..."
npx prisma migrate deploy
MIGRATE_EXIT_CODE=$?

if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
    log "ERROR: Prisma migration failed with exit code $MIGRATE_EXIT_CODE"
    exit $MIGRATE_EXIT_CODE
fi
log "Prisma migrations completed successfully."

# --------------------------------------------------
# Generate Prisma Client
# --------------------------------------------------
log "Generating Prisma client..."
npx prisma generate
GENERATE_EXIT_CODE=$?

if [ $GENERATE_EXIT_CODE -ne 0 ]; then
    log "ERROR: Prisma client generation failed with exit code $GENERATE_EXIT_CODE"
    exit $GENERATE_EXIT_CODE
fi
log "Prisma client generated successfully."

# --------------------------------------------------
# Start Next.js production server
# --------------------------------------------------
log "Starting Next.js server..."
exec node server.js
