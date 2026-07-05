#!/bin/bash
# scripts/check.sh — 一站式质量检查
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════"
echo "  CookMate 全量质量检查"
echo "═══════════════════════════════════════════"
echo ""

PASS=0
FAIL=0

check() {
  local name="$1" cmd="$2"
  printf "  ▸ %-40s ... " "$name"
  if eval "$cmd" 2>/dev/null > /tmp/check-output.txt; then
    echo "✅"
    PASS=$((PASS+1))
  else
    echo "❌"
    cat /tmp/check-output.txt 2>/dev/null | head -5
    FAIL=$((FAIL+1))
  fi
}

check "Structure check" "bash scripts/check-structure.sh"
check "TypeScript compile" "cd apps/web && npx tsc --noEmit"
check "Tests" "cd apps/web && npx vitest run --reporter=verbose"

echo ""
echo "═══════════════════════════════════════════"
echo "  结果: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"
exit $FAIL