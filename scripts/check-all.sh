#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/.analysis-reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

FRONTEND_DIR="$ROOT_DIR/apps/frontend"
BACKEND_DIR="$ROOT_DIR/apps/backend"

FRONTEND_BUILD_LOG="$OUT_DIR/frontend-build-$TIMESTAMP.log"
FRONTEND_LINT_LOG="$OUT_DIR/frontend-lint-$TIMESTAMP.log"
FRONTEND_TEST_LOG="$OUT_DIR/frontend-test-$TIMESTAMP.log"

BACKEND_BUILD_LOG="$OUT_DIR/backend-build-$TIMESTAMP.log"
BACKEND_LINT_LOG="$OUT_DIR/backend-lint-$TIMESTAMP.log"
BACKEND_TEST_LOG="$OUT_DIR/backend-test-$TIMESTAMP.log"
BACKEND_TYPECHECK_LOG="$OUT_DIR/backend-typecheck-$TIMESTAMP.log"

echo "=== FRONTEND: build ==="
cd "$FRONTEND_DIR"
pnpm run build > "$FRONTEND_BUILD_LOG" 2>&1 || true

echo "=== FRONTEND: lint ==="
pnpm run lint > "$FRONTEND_LINT_LOG" 2>&1 || true

echo "=== FRONTEND: tests ==="
pnpm test > "$FRONTEND_TEST_LOG" 2>&1 || true

echo
echo "=== BACKEND: build ==="
cd "$BACKEND_DIR"
pnpm run build > "$BACKEND_BUILD_LOG" 2>&1 || true

echo "=== BACKEND: lint ==="
pnpm run lint > "$BACKEND_LINT_LOG" 2>&1 || true

echo "=== BACKEND: tests ==="
pnpm test > "$BACKEND_TEST_LOG" 2>&1 || true

echo "=== BACKEND: type-check ==="
pnpm run type-check > "$BACKEND_TYPECHECK_LOG" 2>&1 || true

echo
echo "=== SYNTHÈSE FRONTEND (erreurs potentielles) ==="
grep -iE "ERROR|Failed|Type error|Test suite failed" "$FRONTEND_BUILD_LOG" "$FRONTEND_LINT_LOG" "$FRONTEND_TEST_LOG" 2>/dev/null || echo "Aucune erreur détectée côté frontend dans les logs."

echo
echo "=== SYNTHÈSE BACKEND (erreurs potentielles) ==="
grep -iE "ERROR|Failed|Type error|TS[0-9]{4}|Test suite failed" "$BACKEND_BUILD_LOG" "$BACKEND_LINT_LOG" "$BACKEND_TEST_LOG" "$BACKEND_TYPECHECK_LOG" 2>/dev/null || echo "Aucune erreur détectée côté backend dans les logs."

