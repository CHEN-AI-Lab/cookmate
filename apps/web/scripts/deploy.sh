#!/usr/bin/env bash
# Deploy script for CookMate
set -euo pipefail

echo "🚀 Deploying CookMate..."
echo ""

# Run checks first
bash scripts/check-structure.sh

# Build
echo "🏗️  Building for production..."
pnpm build

echo ""
echo "📤 Ready for deployment."
echo "  Vercel: push to main branch → auto-deploy"
echo "  Manual: npx vercel --prod"