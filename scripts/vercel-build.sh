#!/bin/bash
set -e

echo "=== Vercel Custom Build Script ==="
echo "Node version: $(node -v)"
echo "pnpm version: $(pnpm -v)"

# Install only frontend dependencies
echo "=== Installing frontend dependencies ==="
cd apps/frontend

# Generate Prisma client
echo "=== Generating Prisma client ==="
npx prisma generate || echo "Prisma generate skipped"

# Build
echo "=== Building Next.js ==="
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

echo "=== Build complete ==="
