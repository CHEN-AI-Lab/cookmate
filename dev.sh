#!/bin/bash
# Auto-find available port for Next.js dev server
PORT=${PORT:-3001}

# Check if port is available
if ss -tlnp | grep -q ":$PORT "; then
  echo "⚠️ 端口 $PORT 被占用，尝试 $((PORT + 1))..."
  PORT=$((PORT + 1))
fi

echo "🚀 CookMate starting on http://localhost:$PORT"
npx next dev -p "$PORT"