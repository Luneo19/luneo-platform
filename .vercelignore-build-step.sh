#!/bin/bash
# Script pour ignorer les builds Dependabot dans Vercel
# À configurer dans Vercel Dashboard → Settings → Git → Ignored Build Step

# Ignorer les commits de Dependabot
AUTHOR=$(git log -1 --pretty=format:'%an')
if [[ "$AUTHOR" == *"dependabot"* ]] || [[ "$AUTHOR" == *"dependabot[bot]"* ]]; then
  echo "⏭️  Ignoring build for Dependabot commit by $AUTHOR"
  exit 1
fi

# Ignorer les commits qui ne modifient que les dépendances backend
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
if echo "$CHANGED_FILES" | grep -q "^apps/backend" && ! echo "$CHANGED_FILES" | grep -q "^apps/frontend"; then
  echo "⏭️  Ignoring build - only backend files changed"
  exit 1
fi

echo "✅ Proceeding with build"
exit 0
