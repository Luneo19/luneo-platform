#!/usr/bin/env node

/**
 * Script pour remplacer console.error par logger dans les error boundaries
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errorFiles = [
  'apps/frontend/src/app/(dashboard)/dashboard/seller/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/settings/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ai-studio/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ai-studio/templates/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ai-studio/animations/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ab-testing/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/analytics-advanced/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/security/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/library/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/library/import/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ar-studio/collaboration/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ar-studio/library/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ar-studio/integrations/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/ar-studio/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/team/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/billing/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/editor/error.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/analytics/error.tsx',
];

const projectRoot = path.resolve(__dirname, '..');

errorFiles.forEach((filePath) => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already has logger import
  const hasLoggerImport = content.includes("from '@/lib/logger'");
  
  // Replace console.error with logger.error
  if (content.includes('console.error')) {
    // Add logger import if not present
    if (!hasLoggerImport) {
      // Find the last import statement
      const importMatch = content.match(/(import[^;]+;[\s\n]*)+/);
      if (importMatch) {
        const lastImport = importMatch[0];
        const newImport = lastImport.trim() + "\nimport { logger } from '@/lib/logger';";
        content = content.replace(lastImport, newImport);
      } else {
        // Add at the top after 'use client'
        content = content.replace(
          /('use client';[\s\n]*)/,
          "$1import { logger } from '@/lib/logger';\n"
        );
      }
    }

    // Replace console.error with logger.error
    content = content.replace(
      /console\.error\(([^)]+)\);/g,
      (match, args) => {
        // Extract the error variable name if it's just 'error'
        if (args.includes('error') && !args.includes('error:')) {
          return `logger.error('Page error', {
      error: ${args.trim()},
      message: ${args.trim()}.message,
      stack: ${args.trim()}.stack,
      digest: ${args.trim()}.digest,
    });`;
        }
        // For more complex cases, try to preserve the structure
        return `logger.error(${args});`;
      }
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⏭️  Skipped (no console.error): ${filePath}`);
  }
});

console.log('\n✨ All error boundaries updated!');
