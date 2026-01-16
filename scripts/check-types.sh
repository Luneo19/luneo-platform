#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

FRONTEND_DIR="$ROOT_DIR/apps/frontend"
BACKEND_DIR="$ROOT_DIR/apps/backend"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/.analysis-reports"
mkdir -p "$OUT_DIR"

FRONTEND_LOG="$OUT_DIR/frontend-types-$TIMESTAMP.log"
BACKEND_LOG="$OUT_DIR/backend-types-$TIMESTAMP.log"

cd "$FRONTEND_DIR"
pnpm run build > "$FRONTEND_LOG" 2>&1 || true

cd "$BACKEND_DIR"
if pnpm run type-check > "$BACKEND_LOG" 2>&1; then
  :
else
  :
fi

echo "=== FRONTEND TYPE ERRORS (grouped by file) ==="
grep -E "Type error:|Failed to compile.|\\.ts[x]?:[0-9]+:[0-9]+" -A3 -B1 "$FRONTEND_LOG" 2>/dev/null \
  | sed 's/\x1b\[[0-9;]*m//g' \
  | awk '
    /\\.\\// { current=$0 }
    /Type error:/ { print ""; print current; print $0 }
  ' || echo "No frontend type errors found in $FRONTEND_LOG"

echo
echo "=== BACKEND TYPE ERRORS (raw tsc output) ==="
grep -E "error TS[0-9]+:|\\.ts[x]?:[0-9]+:[0-9]+" -A3 -B1 "$BACKEND_LOG" 2>/dev/null \
  | sed 's/\x1b\[[0-9;]*m//g' || echo "No backend type errors found in $BACKEND_LOG"

