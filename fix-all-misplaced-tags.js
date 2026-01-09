#!/usr/bin/env node

/**
 * Script FINAL pour supprimer TOUTES les balises fermantes mal placées
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

function fixAllMisplacedTags(filePath) {
  console.log(`\n🔧 Correction finale de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return { fixed: false };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  // Liste exhaustive de tous les patterns à corriger
  const fixes = [
    // Balises fermantes dans les expressions
    { pattern: /<\/Checkbox>\)\}/g, replacement: ')}' },
    { pattern: /<\/Input>\)\}/g, replacement: ')}' },
    { pattern: /<\/motion>\)\}/g, replacement: ')}' },
    { pattern: /<\/div>\)\}/g, replacement: ')}' },
    { pattern: /<\/Tabs>\)\}/g, replacement: ')}' },
    { pattern: /<\/Button>\)\}/g, replacement: ')}' },
    { pattern: /<\/Badge>\)\}/g, replacement: ')}' },
    
    // Balises fermantes avant des parenthèses
    { pattern: /<\/Checkbox>\)/g, replacement: ')' },
    { pattern: /<\/Input>\)/g, replacement: ')' },
    { pattern: /<\/motion>\)/g, replacement: ')' },
    { pattern: /<\/div>\)/g, replacement: ')' },
    { pattern: /<\/Tabs>\)/g, replacement: ')' },
    
    // Balises fermantes dans les appels de fonction
    { pattern: /\(([^)]*?)\s*<\/[^>]+>\)\}/g, replacement: '($1)}' },
    { pattern: /\(([^)]*?)\s*<\/[^>]+>\)/g, replacement: '($1)' },
    
    // Balises fermantes mal placées avant des accolades
    { pattern: /<\/[^>]+>\s*\}/g, replacement: '}' },
    
    // Balises doubles
    { pattern: /<\/span><\/div>/g, replacement: '</div>' },
    { pattern: /<\/p><\/div>/g, replacement: '</div>' },
    { pattern: /<\/DialogDescription><\/DialogHeader>/g, replacement: '</DialogHeader>' },
    { pattern: /<\/DialogHeader><\/div>/g, replacement: '</div>' },
    
    // Balises fermantes dans les className
    { pattern: /className=\{cn\(([^}]*?)\s*<\/[^>]+>\)\}/g, replacement: 'className={cn($1)}' },
    
    // Balises fermantes dans les onChange
    { pattern: /onChange=\{\(e\)\s*=>\s*([^}]*?)\s*<\/[^>]+>\)\}/g, replacement: 'onChange={(e) => $1)}' },
    { pattern: /onCheckedChange=\{\(\)\s*=>\s*([^}]*?)\s*<\/[^>]+>\)\}/g, replacement: 'onCheckedChange={() => $1)}' },
    
    // Balises fermantes dans les onClick
    { pattern: /onClick=\{\(\)\s*=>\s*([^}]*?)\s*<\/[^>]+>\)\}/g, replacement: 'onClick={() => $1)}' },
    
    // Balises fermantes dans les formatPrice
    { pattern: /formatPrice\(([^)]*?)\s*<\/[^>]+>\)/g, replacement: 'formatPrice($1)' },
    
    // Balises fermantes isolées avant des tags
    { pattern: /\n\s*<\/[^>]+>\s*\n\s*<\/div>/g, replacement: '\n        </div>' },
    { pattern: /\n\s*<\/[^>]+>\s*\n\s*<\/CardContent>/g, replacement: '\n        </CardContent>' },
    { pattern: /\n\s*<\/[^>]+>\s*\n\s*<\/Card>/g, replacement: '\n        </Card>' },
    
    // </motion> mal placé
    { pattern: /<\/motion><\/div>/g, replacement: '</div>' },
    
    // </ErrorBoundary> mal placé
    { pattern: /<\/ErrorBoundary><\/div><\/div>/g, replacement: '</div></div>' },
  ];

  for (const { pattern, replacement } of fixes) {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      fixed = true;
      console.log(`   ✓ Pattern corrigé`);
    }
  }

  // Corrections spécifiques supplémentaires
  // Supprimer les balises fermantes qui apparaissent dans des contextes JavaScript
  const jsContextPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:]\s*[^<]*?)\s*<\/[^>]+>/g;
  content = content.replace(jsContextPattern, (match, before) => {
    // Vérifier si c'est vraiment dans un contexte JS (pas JSX)
    if (before.match(/[=:]\s*[^<]*$/)) {
      fixed = true;
      return before;
    }
    return match;
  });

  if (fixed && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé: ${filePath}`);
  } else {
    console.log(`✓ Aucune correction nécessaire`);
  }

  return { fixed };
}

function main() {
  console.log('🔧 Correction FINALE de toutes les balises mal placées...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;

  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixAllMisplacedTags(fullPath);
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

module.exports = { fixAllMisplacedTags };









