#!/usr/bin/env node

/**
 * Script pour supprimer les balises fermantes incorrectes ajoutées aux types TypeScript
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

// Balises qui sont des types TypeScript, pas des balises JSX
const TYPESCRIPT_TAGS = ['Set', 'string', 'Product', 'Collection', 'Template', 'Record', 'Array', 'Order', 'Integration', 'EcommercePlatform', 'OrderFilters', 'ViewMode', 'SortOption', 'OrderInsight', 'HTMLDivElement', 'HTMLInputElement', '20ms'];

function cleanupTypeScriptTags(filePath) {
  console.log(`\n🧹 Nettoyage de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return { fixed: false };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  // Supprimer les balises fermantes de types TypeScript qui apparaissent dans des contextes incorrects
  for (const tag of TYPESCRIPT_TAGS) {
    // Pattern pour trouver </Tag> qui n'est pas précédé d'un <Tag> JSX valide
    // On cherche les cas où </Tag> apparaît après des types TypeScript
    
    // Cas 1: </Tag> après une parenthèse ouvrante ou une virgule (dans un objet/array)
    const pattern1 = new RegExp(`([,}\\)\\]])\\s*</${tag}>`, 'g');
    if (pattern1.test(content)) {
      content = content.replace(pattern1, '$1');
      fixed = true;
      console.log(`   ✓ Supprimé </${tag}> après ponctuation`);
    }
    
    // Cas 2: </Tag> au début d'une ligne après un type TypeScript
    const pattern2 = new RegExp(`\\n\\s*</${tag}>\\s*\\n`, 'g');
    if (pattern2.test(content)) {
      content = content.replace(pattern2, '\n');
      fixed = true;
      console.log(`   ✓ Supprimé </${tag}> isolé`);
    }
    
    // Cas 3: </Tag> avant une accolade fermante ou parenthèse
    const pattern3 = new RegExp(`</${tag}>\\s*([}\\)])`, 'g');
    if (pattern3.test(content)) {
      content = content.replace(pattern3, '$1');
      fixed = true;
      console.log(`   ✓ Supprimé </${tag}> avant fermeture`);
    }
    
    // Cas 4: </Tag> après un type générique TypeScript
    const pattern4 = new RegExp(`<${tag}[^>]*>\\s*</${tag}>`, 'g');
    if (pattern4.test(content)) {
      // C'est un type générique vide, on le laisse tel quel
    }
    
    // Cas 5: </Tag> qui suit directement un identifiant (variable, fonction)
    const pattern5 = new RegExp(`(\\w+)\\s*</${tag}>`, 'g');
    const matches = [...content.matchAll(pattern5)];
    for (const match of matches) {
      const before = content.substring(Math.max(0, match.index - 50), match.index);
      // Si c'est dans un contexte TypeScript (après :, <, etc.), supprimer
      if (before.match(/[:<,\(\[\{]\s*$/)) {
        content = content.substring(0, match.index + match[1].length) + 
                  content.substring(match.index + match[0].length);
        fixed = true;
        console.log(`   ✓ Supprimé </${tag}> après ${match[1]}`);
      }
    }
  }

  // Nettoyage spécifique pour les cas connus
  // </Set> après new Set(
  content = content.replace(/new Set\(\s*<\/Set>/g, 'new Set(');
  if (content !== originalContent) fixed = true;
  
  // </string> après des propriétés d'objet
  content = content.replace(/:\s*['"][^'"]*['"],\s*<\/string>/g, (match) => {
    return match.replace(/\s*<\/string>/, '');
  });
  if (content !== originalContent) fixed = true;
  
  // </Product> après des propriétés
  content = content.replace(/,\s*<\/Product>\s*\}/g, ' }');
  if (content !== originalContent) fixed = true;
  
  // </string> dans les appels de fonction
  content = content.replace(/\([^)]*<\/string>\s*\)/g, (match) => {
    return match.replace(/\s*<\/string>\s*/g, ' ');
  });
  if (content !== originalContent) fixed = true;

  if (fixed && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier nettoyé: ${filePath}`);
  } else {
    console.log(`✓ Aucun nettoyage nécessaire`);
  }

  return { fixed };
}

function main() {
  console.log('🧹 Nettoyage des balises TypeScript incorrectes...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;

  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = cleanupTypeScriptTags(fullPath);
    if (result.fixed) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Fichiers nettoyés: ${totalFixed}`);
  console.log(`\n✨ Nettoyage terminé!`);
}

if (require.main === module) {
  main();
}

module.exports = { cleanupTypeScriptTags };

