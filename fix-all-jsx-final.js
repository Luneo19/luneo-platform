#!/usr/bin/env node

/**
 * Script FINAL pour corriger TOUTES les balises JSX non fermées en une seule passe
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/integrations/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx',
];

function fixFile(filePath) {
  console.log(`\n🔧 Correction de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé`);
    return { fixed: false };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  // 1. Corriger les balises <p> non fermées
  content = content.replace(/<p([^>]*)>([^<]*?)(?=\s*<\/div>|\s*<\/Card>|\s*<\/CardContent>|\s*<\/span>|\s*<\/h3>|\s*<\/h4>)/g, (match, attrs, inner) => {
    if (!match.includes('</p>')) {
      fixed = true;
      return `<p${attrs}>${inner}</p>`;
    }
    return match;
  });

  // 2. Corriger les balises <span> non fermées
  content = content.replace(/<span([^>]*)>([^<]*?)(?=\s*<\/div>|\s*<\/Button>|\s*<\/p>)/g, (match, attrs, inner) => {
    if (!match.includes('</span>')) {
      fixed = true;
      return `<span${attrs}>${inner}</span>`;
    }
    return match;
  });

  // 3. Corriger les balises <TabsTrigger> non fermées
  content = content.replace(/<TabsTrigger([^>]*)>([^<]+?)(?=\s*<TabsTrigger|\s*<\/TabsList>)/g, (match, attrs, inner) => {
    if (!match.includes('</TabsTrigger>')) {
      fixed = true;
      return `<TabsTrigger${attrs}>${inner}</TabsTrigger>`;
    }
    return match;
  });

  // 4. Corriger les balises <SelectItem> non fermées
  content = content.replace(/<SelectItem([^>]*)>([^<]+?)(?=\s*<SelectItem|\s*<\/SelectContent>)/g, (match, attrs, inner) => {
    if (!match.includes('</SelectItem>')) {
      fixed = true;
      return `<SelectItem${attrs}>${inner}</SelectItem>`;
    }
    return match;
  });

  // 5. Corriger les balises <Button> non fermées avant </div>
  content = content.replace(/<Button([^>]*)>([^<]*?)(?=\s*<\/div>|\s*<\/DialogFooter>|\s*<\/DialogTrigger>)/g, (match, attrs, inner) => {
    if (!match.includes('</Button>')) {
      fixed = true;
      return `<Button${attrs}>${inner}</Button>`;
    }
    return match;
  });

  // 6. Corriger les structures avec </div> manquant avant </>
  content = content.replace(/<\/>\s*<\/div>/g, '</div>\n                </>');
  content = content.replace(/<\/>\s*\)\s*\)/g, '</div>\n                </>');

  // 7. Corriger les </Card> manquants avant ))
  content = content.replace(/<\/div>\s*<\/div>\s*\)\s*\)/g, (match) => {
    if (!match.includes('</Card>')) {
      fixed = true;
      return '</div>\n            </div>\n          </Card>\n          ));';
    }
    return match;
  });

  // 8. Corriger les balises </motion.div> manquantes
  content = content.replace(/<\/Card>\s*\)\s*\)/g, '</Card>\n        </motion.div>\n      );');

  // 9. Corriger les structures avec </div> manquant
  content = content.replace(/<\/span>\s*<\/span>/g, '</span>');

  if (fixed && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé`);
  } else {
    console.log(`✓ Aucune correction nécessaire`);
  }

  return { fixed };
}

function main() {
  console.log('🚀 Correction FINALE de toutes les balises JSX...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;

  for (const filePath of FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixFile(fullPath);
    if (result.fixed) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Résumé: ${totalFixed} fichiers corrigés`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };




