#!/usr/bin/env bash
# Setup script - install dependencies and configure project
set -euo pipefail

echo "🚀 CookMate Setup"
echo "=================="

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || echo "ℹ️  Migration skipped or already applied"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. cp .env.example .env.local (fill in values)"
echo "  2. pnpm dev (starts on port 3001)"