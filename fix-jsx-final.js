#!/usr/bin/env node

/**
 * Script FINAL ULTRA PERFORMANT - Restaure les backups et applique uniquement les corrections nécessaires
 */

const fs = require('fs');
const path = require('path');

const PRIORITY_FILES = [
  'apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/integrations/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx',
];

/**
 * Corrige les erreurs spécifiques identifiées
 */
function fixSpecificErrors(filePath) {
  console.log(`\n🔧 Correction ciblée de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return { fixed: false };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  // Corrections spécifiques basées sur les erreurs réelles
  const specificFixes = [
    // Badge non fermés
    { pattern: /<Badge([^>]*)>([^<]*?)(?=\s*<\/div>)/g, replacement: (match, attrs, inner) => {
      if (!match.includes('</Badge>')) {
        fixed = true;
        return `<Badge${attrs}>${inner}</Badge>`;
      }
      return match;
    }},
    { pattern: /<Badge([^>]*)>([^<]*?)(?=\s*<\/CardContent>)/g, replacement: (match, attrs, inner) => {
      if (!match.includes('</Badge>')) {
        fixed = true;
        return `<Badge${attrs}>${inner}</Badge>`;
      }
      return match;
    }},
    { pattern: /<Badge([^>]*)>([^<]*?)(?=\s*\)\s*\))/g, replacement: (match, attrs, inner) => {
      if (!match.includes('</Badge>')) {
        fixed = true;
        return `<Badge${attrs}>${inner}</Badge>`;
      }
      return match;
    }},
    
    // Button non fermés
    { pattern: /<Button([^>]*)>([^<]*?)(?=\s*<\/DialogFooter>)/g, replacement: (match, attrs, inner) => {
      if (!match.includes('</Button>')) {
        fixed = true;
        return `<Button${attrs}>${inner}</Button>`;
      }
      return match;
    }},
    { pattern: /<Button([^>]*)>([^<]*?)(?=\s*<\/DialogTrigger>)/g, replacement: (match, attrs, inner) => {
      if (!match.includes('</Button>')) {
        fixed = true;
        return `<Button${attrs}>${inner}</Button>`;
      }
      return match;
    }},
    
    // Supprimer les balises fermantes mal placées dans les expressions
    { pattern: /<\/[^>]+>\)\}/g, replacement: ')}' },
    { pattern: /<\/[^>]+>\)/g, replacement: ')' },
    
    // Supprimer les balises TypeScript
    { pattern: /<\/Set>/g, replacement: '' },
    { pattern: /<\/string>/g, replacement: '' },
    { pattern: /<\/Product>/g, replacement: '' },
    { pattern: /<\/Collection>/g, replacement: '' },
    { pattern: /<\/Template>/g, replacement: '' },
    { pattern: /<\/Record>/g, replacement: '' },
    { pattern: /<\/Array>/g, replacement: '' },
    { pattern: /<\/Order>/g, replacement: '' },
    { pattern: /<\/Integration>/g, replacement: '' },
    { pattern: /<\/EcommercePlatform>/g, replacement: '' },
    { pattern: /<\/OrderFilters>/g, replacement: '' },
    { pattern: /<\/ViewMode>/g, replacement: '' },
    { pattern: /<\/SortOption>/g, replacement: '' },
    { pattern: /<\/OrderInsight>/g, replacement: '' },
    { pattern: /<\/HTMLDivElement>/g, replacement: '' },
    { pattern: /<\/HTMLInputElement>/g, replacement: '' },
    { pattern: /<\/20ms>/g, replacement: '' },
  ];

  for (const fix of specificFixes) {
    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
  }

  if (fixed && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé: ${filePath}`);
  } else {
    console.log(`✓ Aucune correction nécessaire`);
  }

  return { fixed };
}

function main() {
  console.log('🔧 Correction FINALE ciblée...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;

  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixSpecificErrors(fullPath);
    if (result.fixed) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Fichiers corrigés: ${totalFixed}`);
  console.log(`\n✨ Correction terminée!`);
}

if (require.main === module) {
  main();
}

module.exports = { fixSpecificErrors };






