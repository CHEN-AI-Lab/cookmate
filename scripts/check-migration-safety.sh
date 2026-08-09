#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 迁移安全检查 — 扫描 Prisma 迁移 SQL 中的危险操作
# 防止生产数据被误删。
#
# 用法: bash scripts/check-migration-safety.sh
# 发现危险操作时 exit 1，并输出中文提示。
#
# 注意: 这个脚本是 AI 自动执行的，如果失败，
# AI 必须用中文向用户报告具体原因。
# ─────────────────────────────────────────────────────────────

set -euo pipefail

MIGRATIONS_DIR="prisma/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "ℹ️  没有 prisma/migrations 目录，跳过检查。"
  exit 0
fi

FAILED=0

# ── 危险操作列表 ──────────────────────────────────────────
# 格式: "描述|正则表达式"
DANGEROUS_PATTERNS=(
  "删除表 (DROP TABLE)|DROP TABLE"
  "删除列 (DROP COLUMN)|DROP COLUMN"
  "删除 Schema (DROP SCHEMA)|DROP SCHEMA"
  "清空表数据 (TRUNCATE)|TRUNCATE"
  "修改列类型 (ALTER COLUMN TYPE)|ALTER COLUMN .* TYPE"
)

echo "=========================================="
echo "    🔒 数据库迁移安全检查"
echo "=========================================="
echo ""

while IFS= read -r -d '' FILE; do
  [[ "$FILE" != *.sql ]] && continue
  MIGRATION_NAME=$(basename "$(dirname "$FILE")")
  [ -s "$FILE" ] || continue
  CONTENT=$(cat "$FILE")

  for entry in "${DANGEROUS_PATTERNS[@]}"; do
    DESC="${entry%%|*}"
    REGEX="${entry#*|}"
    if echo "$CONTENT" | grep -qEi "$REGEX"; then
      echo "❌ [${MIGRATION_NAME}] 发现危险操作：${DESC}"
      echo "   文件：$FILE"
      echo ""
      FAILED=1
    fi
  done
done < <(find "$MIGRATIONS_DIR" -name "migration.sql" -print0)

if [ "$FAILED" -eq 1 ]; then
  echo "⛔ 错误：迁移文件中存在危险操作，部署已拦截。"
  echo "   这些操作会删除生产数据，请修复迁移 SQL 后再提交。"
  echo ""
  exit 1
else
  echo "✅ 通过：未发现危险操作。"
  exit 0
fi