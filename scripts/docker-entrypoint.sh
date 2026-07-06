#!/bin/sh
# CookMate Docker entrypoint
set -e

echo "=== CookMate Docker Entrypoint ==="

# Run database migrations
echo "▸ Running database migrations..."
cd /app/apps/web
npx prisma db push --skip-generate 2>&1 || echo "⚠️ Migration skipped (no changes needed)"
cd /app

# Start Next.js
echo "▸ Starting Next.js..."
exec node /app/apps/web/server.js