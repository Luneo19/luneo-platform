#!/bin/bash
set -e
npm install --legacy-peer-deps
mkdir -p node_modules/@luneo/billing-plans node_modules/@luneo/ai-safety node_modules/@luneo/types
cp -r src/lib/packages/billing-plans/* node_modules/@luneo/billing-plans/
cp -r src/lib/packages/ai-safety/* node_modules/@luneo/ai-safety/
cp -r src/lib/packages/types/* node_modules/@luneo/types/
echo "✅ Installation complète"

