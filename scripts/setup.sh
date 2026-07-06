#!/bin/bash
# scripts/setup.sh — 项目初始化
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== CookMate 项目初始化 ==="

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
  echo "❌ 请先安装 pnpm: npm install -g pnpm"
  exit 1
fi

# 安装依赖
echo "▸ 安装依赖..."
pnpm install

# 生成 Prisma 客户端
echo "▸ 生成 Prisma Client..."
cd apps/web
npx prisma generate
cd "$ROOT"

# 检查环境变量
if [ ! -f .env ]; then
  echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
  cp .env.example .env
  echo "   请编辑 .env 填入实际配置后再启动"
fi

echo ""
echo "✅ 初始化完成"
echo "   启动: pnpm dev"
echo "   构建: pnpm build"