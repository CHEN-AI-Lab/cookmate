#!/bin/bash
# scripts/deploy.sh — 部署脚本
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== CookMate 部署 ==="
BRANCH="${1:-preview}"
echo "▸ 推送分支: $BRANCH"

# 检查未提交修改
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  有未提交的修改，先提交..."
  git add -A
  git commit -m "chore: deploy commit $(date +%Y%m%d%H%M%S)"
fi

# 推送
git push origin "$BRANCH"
echo "✅ 已推送 $BRANCH，Vercel 自动部署中"