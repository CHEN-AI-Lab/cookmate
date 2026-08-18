#!/bin/bash
# scripts/find-dev-server.sh — 扫描 3000-3009 端口，找到当前项目的 dev server
# 避免硬编码端口号，E2E 测试前先确认哪个端口属于本项目
#
# 用法: PORT=$(bash scripts/find-dev-server.sh)
#   如果找到返回端口号（如 3001），未找到返回空字符串
#   也可以直接 source: bash scripts/find-dev-server.sh && echo $PORT
#
# 检测方式：curl 每个端口的首页，看响应是否包含项目标识

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 项目标识 — 从 package.json 读项目名
PROJECT_NAME=$(python3 -c "import json; print(json.load(open('package.json'))['name'])" 2>/dev/null || echo "")

PORT=""

for p in $(seq 3000 3009); do
  # 尝试请求首页，5 秒超时
  RESPONSE=$(curl -s --max-time 5 "http://localhost:$p" 2>/dev/null || true)
  if [ -z "$RESPONSE" ]; then
    continue
  fi
  # 检查是否包含项目标识（cookmate / CookMate）
  if echo "$RESPONSE" | grep -qi "cookmate" 2>/dev/null; then
    PORT="$p"
    break
  fi
done

if [ -n "$PORT" ]; then
  echo "$PORT"
else
  # 未找到已运行的 dev server
  exit 0
fi
