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

# Translation key parity check
check "Translation keys parity" 'python3 -c "
import json
with open(\"shared/messages/zh-CN.json\") as f: zh = json.load(f)
with open(\"shared/messages/en.json\") as f: en = json.load(f)
zh_keys = {k for k in zh if isinstance(zh[k], dict)}
en_keys = {k for k in en if isinstance(en[k], dict)}
missing = zh_keys - en_keys
extra = en_keys - zh_keys
issues = []
if missing: issues.append(\"Missing en sections: \" + str(missing))
if extra: issues.append(\"Extra en sections: \" + str(extra))
for section in sorted(zh_keys):
    zh_sec = set(zh[section].keys())
    en_sec = set(en[section].keys())
    diff = zh_sec - en_sec
    if diff: issues.append(f\"{section}: missing en keys {diff}\")
    diff = en_sec - zh_sec
    if diff: issues.append(f\"{section}: extra en keys {diff}\")
if issues: raise SystemExit(chr(10).join(issues))
"'

check "Build" "pnpm build"
check "Tests" "pnpm test"

echo ""
echo "═══════════════════════════════════════════"
echo "  结果: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"
exit $FAIL