#!/bin/sh
# CookMate Docker entrypoint
set -e

echo "=== CookMate Docker Entrypoint ==="

# Run database migrations
echo "▸ Running database migrations..."
cd /app/apps/web
npx prisma migrate deploy --schema=../../prisma/schema.prisma 2>&1 || echo "⚠️ No pending migrations"
cd /app

# Start Next.js
echo "▸ Starting Next.js..."
exec node /app/apps/web/server.js