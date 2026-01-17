#!/bin/bash
# Script pour installer les dépendances en ignorant les erreurs fsevents
set -e

cd ../..
pnpm install --no-frozen-lockfile --ignore-scripts 2>&1 | grep -v 'fsevents' || true
cd apps/frontend
pnpm install --filter luneo-frontend... --no-frozen-lockfile --ignore-scripts 2>&1 | grep -v 'fsevents' || true
