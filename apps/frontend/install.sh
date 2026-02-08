#!/bin/bash
set -e
pnpm install
PACKAGES_ROOT="../../packages"
mkdir -p node_modules/@luneo/billing-plans node_modules/@luneo/ai-safety node_modules/@luneo/types
if [ -d "$PACKAGES_ROOT/billing-plans" ]; then cp -r "$PACKAGES_ROOT/billing-plans"/* node_modules/@luneo/billing-plans/; fi
if [ -d "$PACKAGES_ROOT/ai-safety" ]; then cp -r "$PACKAGES_ROOT/ai-safety"/* node_modules/@luneo/ai-safety/; fi
if [ -d "$PACKAGES_ROOT/types" ]; then cp -r "$PACKAGES_ROOT/types"/* node_modules/@luneo/types/; fi
echo "✅ Installation complète"

