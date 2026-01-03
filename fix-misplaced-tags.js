#!/usr/bin/env node

/**
 * Script pour supprimer les balises fermantes mal placées introduites par le script précédent
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

function fixMisplacedTags(filePath) {
  console.log(`\n🔧 Correction de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return { fixed: false };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  // Supprimer les balises fermantes mal placées dans les expressions
  const patterns = [
    // </motion>)} ou </motion>}
    { pattern: /<\/motion>\)\}/g, replacement: ')}' },
    { pattern: /<\/motion>\}/g, replacement: '}' },
    
    // </Input>)} ou </Input>}
    { pattern: /<\/Input>\)\}/g, replacement: ')}' },
    { pattern: /<\/Input>\}/g, replacement: '}' },
    
    // </div>)} ou </div>}
    { pattern: /<\/div>\)\}/g, replacement: ')}' },
    { pattern: /<\/div>\}/g, replacement: '}' },
    
    // </string></div>
    { pattern: /<\/string><\/div>/g, replacement: '</div>' },
    
    // </input></div>
    { pattern: /<\/input><\/div>/g, replacement: '</div>' },
    
    // </motion> dans les expressions ternaires
    { pattern: /([^>])\s*<\/motion>\)/g, replacement: '$1)' },
    
    // </Input> dans les onChange
    { pattern: /(e\.target\.value[^)]*)\s*<\/Input>\)/g, replacement: '$1)' },
    
    // </div> dans les appels de fonction
    { pattern: /(formatPrice\([^)]*)\s*<\/div>\)/g, replacement: '$1)' },
    
    // </ErrorBoundary> mal placé
    { pattern: /<\/ErrorBoundary><\/div><\/div>/g, replacement: '</div></div>' },
  ];

  for (const { pattern, replacement } of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      fixed = true;
      console.log(`   ✓ Pattern corrigé: ${pattern}`);
    }
  }

  // Corrections spécifiques pour les cas connus
  // </motion>)} dans les className
  content = content.replace(/className=\{cn\(([^}]*?)\s*<\/motion>\)\}/g, (match, inner) => {
    fixed = true;
    return `className={cn(${inner})}`;
  });

  // </Input>)} dans les onChange
  content = content.replace(/onChange=\{\(e\)\s*=>\s*([^}]*?)\s*<\/Input>\)\}/g, (match, inner) => {
    fixed = true;
    return `onChange={(e) => ${inner})}`;
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
  console.log('🔧 Correction des balises mal placées...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;

  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixMisplacedTags(fullPath);
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

module.exports = { fixMisplacedTags };




