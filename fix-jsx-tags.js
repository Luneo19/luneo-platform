#!/usr/bin/env node

/**
 * Script ultra performant pour corriger automatiquement toutes les balises JSX non fermées
 * Analyse la totalité du code et corrige les erreurs de structure JSX
 */

const fs = require('fs');
const path = require('path');

// Fichiers prioritaires à corriger
const PRIORITY_FILES = [
  'apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/integrations/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx',
  'apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx',
];

// Balises auto-fermantes (ne nécessitent pas de balise fermante)
const SELF_CLOSING_TAGS = new Set([
  'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed',
  'source', 'track', 'wbr', 'Image', 'img'
]);

// Balises qui peuvent être auto-fermantes en JSX
const JSX_SELF_CLOSING_PATTERN = /<(\w+)[^>]*\/\s*>/g;

/**
 * Analyse et corrige les balises JSX non fermées dans un fichier
 */
function fixJSXTags(filePath) {
  console.log(`\n🔍 Analyse de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return { fixed: false, errors: [] };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const errors = [];
  let fixed = false;

  // 1. Corriger les balises Badge non fermées
  const badgePattern = /<Badge([^>]*)>([^<]*?)(?=<\/Badge>|<\/div>|<\/CardContent>|<\/Card>|<\/Button>|<\/TableCell>|<\/div>|\)\s*\)|\)\s*})/g;
  let badgeMatches = [];
  let match;
  
  // Trouver tous les Badge ouverts
  const badgeOpenPattern = /<Badge([^>]*)>/g;
  const badgeClosePattern = /<\/Badge>/g;
  
  let openBadges = [];
  let closeBadges = [];
  
  while ((match = badgeOpenPattern.exec(content)) !== null) {
    openBadges.push({ index: match.index, tag: match[0] });
  }
  
  while ((match = badgeClosePattern.exec(content)) !== null) {
    closeBadges.push(match.index);
  }
  
  // Trier les positions
  openBadges.sort((a, b) => b.index - a.index);
  closeBadges.sort((a, b) => b - a);
  
  // Corriger les Badge non fermés
  for (const openBadge of openBadges) {
    const nextClose = closeBadges.find(closeIdx => closeIdx > openBadge.index);
    if (!nextClose) {
      // Trouver la position où insérer </Badge>
      const afterBadge = openBadge.index + openBadge.tag.length;
      const nextTag = content.indexOf('</', afterBadge);
      const nextDiv = content.indexOf('</div>', afterBadge);
      const nextCardContent = content.indexOf('</CardContent>', afterBadge);
      const nextCard = content.indexOf('</Card>', afterBadge);
      const nextButton = content.indexOf('</Button>', afterBadge);
      const nextParen = content.indexOf(')', afterBadge);
      const nextBrace = content.indexOf('}', afterBadge);
      
      let insertPos = Math.min(
        nextTag !== -1 ? nextTag : Infinity,
        nextDiv !== -1 ? nextDiv : Infinity,
        nextCardContent !== -1 ? nextCardContent : Infinity,
        nextCard !== -1 ? nextCard : Infinity,
        nextButton !== -1 ? nextButton : Infinity,
        nextParen !== -1 ? nextParen : Infinity,
        nextBrace !== -1 ? nextBrace : Infinity
      );
      
      if (insertPos !== Infinity && insertPos > afterBadge) {
        // Vérifier qu'il n'y a pas déjà un </Badge> entre openBadge et insertPos
        const between = content.substring(afterBadge, insertPos);
        if (!between.includes('</Badge>')) {
          // Trouver la fin de la ligne ou le prochain tag
          const lineEnd = content.indexOf('\n', afterBadge);
          const indentMatch = content.substring(0, afterBadge).match(/(\n\s*)$/);
          const indent = indentMatch ? indentMatch[1].replace('\n', '') : '                        ';
          
          // Insérer </Badge> avant le tag suivant
          const beforeTag = content.substring(0, insertPos).trimEnd();
          const afterTag = content.substring(insertPos);
          
          content = beforeTag + '\n' + indent + '</Badge>' + afterTag;
          errors.push(`Badge non fermé à la ligne ${content.substring(0, openBadge.index).split('\n').length}`);
          fixed = true;
          closeBadges.push(insertPos); // Ajouter la position pour éviter les doublons
        }
      }
    }
  }

  // 2. Corriger les balises Button non fermées
  const buttonOpenPattern = /<Button([^>]*)>/g;
  const buttonClosePattern = /<\/Button>/g;
  
  openBadges = [];
  closeBadges = [];
  
  while ((match = buttonOpenPattern.exec(content)) !== null) {
    openBadges.push({ index: match.index, tag: match[0] });
  }
  
  while ((match = buttonClosePattern.exec(content)) !== null) {
    closeBadges.push(match.index);
  }
  
  openBadges.sort((a, b) => b.index - a.index);
  closeBadges.sort((a, b) => b - a);
  
  for (const openButton of openBadges) {
    const nextClose = closeBadges.find(closeIdx => closeIdx > openButton.index);
    if (!nextClose) {
      const afterButton = openButton.index + openButton.tag.length;
      const nextTag = content.indexOf('</', afterButton);
      const nextDiv = content.indexOf('</div>', afterButton);
      const nextDialogFooter = content.indexOf('</DialogFooter>', afterButton);
      const nextCardContent = content.indexOf('</CardContent>', afterButton);
      const nextCard = content.indexOf('</Card>', afterButton);
      const nextParen = content.indexOf(')', afterButton);
      const nextBrace = content.indexOf('}', afterButton);
      
      let insertPos = Math.min(
        nextTag !== -1 ? nextTag : Infinity,
        nextDiv !== -1 ? nextDiv : Infinity,
        nextDialogFooter !== -1 ? nextDialogFooter : Infinity,
        nextCardContent !== -1 ? nextCardContent : Infinity,
        nextCard !== -1 ? nextCard : Infinity,
        nextParen !== -1 ? nextParen : Infinity,
        nextBrace !== -1 ? nextBrace : Infinity
      );
      
      if (insertPos !== Infinity && insertPos > afterButton) {
        const between = content.substring(afterButton, insertPos);
        if (!between.includes('</Button>')) {
          const lineEnd = content.indexOf('\n', afterButton);
          const indentMatch = content.substring(0, afterButton).match(/(\n\s*)$/);
          const indent = indentMatch ? indentMatch[1].replace('\n', '') : '                        ';
          
          const beforeTag = content.substring(0, insertPos).trimEnd();
          const afterTag = content.substring(insertPos);
          
          content = beforeTag + '\n' + indent + '</Button>' + afterTag;
          errors.push(`Button non fermé à la ligne ${content.substring(0, openButton.index).split('\n').length}`);
          fixed = true;
          closeBadges.push(insertPos);
        }
      }
    }
  }

  // 3. Corriger les structures map() avec return manquant
  const mapPattern = /\.map\([^)]*=>\s*\{?\s*(const\s+\w+\s*=\s*[^;]+;)\s*(const\s+colorClasses)/g;
  content = content.replace(mapPattern, (match, p1, p2) => {
    fixed = true;
    errors.push('Structure map() corrigée - return en double supprimé');
    return match.replace(/\s+return\s*\(/g, '');
  });

  // 4. Corriger les structures avec return ( en double
  const doubleReturnPattern = /(\s+)return\s*\(\s*return\s*\(/g;
  content = content.replace(doubleReturnPattern, (match, indent) => {
    fixed = true;
    errors.push('return ( en double corrigé');
    return indent + 'return (';
  });

  // 5. Corriger les balises div non fermées dans les structures map
  const mapDivPattern = /(\.map\([^)]*=>\s*\{?\s*return\s*\([^)]*<div[^>]*>[\s\S]*?)(<\/div>\s*\)\s*\)\s*\}\)/g;
  // Cette regex est complexe, on va utiliser une approche différente

  // 6. Vérifier et corriger les structures JSX basiques
  const lines = content.split('\n');
  const stack = [];
  let inJSX = false;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let j = 0;
    
    while (j < line.length) {
      const char = line[j];
      const nextChar = j + 1 < line.length ? line[j + 1] : '';
      
      // Gérer les strings
      if ((char === '"' || char === "'" || char === '`') && (j === 0 || line[j - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        j++;
        continue;
      }
      
      if (inString) {
        j++;
        continue;
      }
      
      // Détecter les balises ouvrantes
      if (char === '<' && nextChar !== '/' && nextChar !== '!' && nextChar !== '?') {
        const tagMatch = line.substring(j).match(/^<(\w+)([^>]*)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          const attrs = tagMatch[2];
          const isSelfClosing = attrs.trim().endsWith('/') || SELF_CLOSING_TAGS.has(tagName.toLowerCase());
          
          if (!isSelfClosing) {
            stack.push({ tag: tagName, line: i + 1, index: j });
          }
          j += tagMatch[0].length;
          continue;
        }
      }
      
      // Détecter les balises fermantes
      if (char === '<' && nextChar === '/') {
        const tagMatch = line.substring(j).match(/^<\/(\w+)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
            stack.pop();
          }
          j += tagMatch[0].length;
          continue;
        }
      }
      
      j++;
    }
  }

  // Si des balises sont encore ouvertes, les fermer
  if (stack.length > 0) {
    const lastOpen = stack[stack.length - 1];
    errors.push(`Balise <${lastOpen.tag}> non fermée à la ligne ${lastOpen.line}`);
    
    // Essayer de fermer automatiquement
    const lastLine = lines[lines.length - 1];
    const indent = lastLine.match(/^(\s*)/)[1];
    lines.push(indent + `</${lastOpen.tag}>`);
    fixed = true;
    content = lines.join('\n');
  }

  if (fixed && content !== originalContent) {
    // Créer une backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    console.log(`💾 Backup créé: ${backupPath}`);
    
    // Sauvegarder le fichier corrigé
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé: ${filePath}`);
    console.log(`   Erreurs corrigées: ${errors.length}`);
    errors.forEach(err => console.log(`   - ${err}`));
  } else if (!fixed) {
    console.log(`✓ Aucune erreur détectée`);
  }

  return { fixed, errors };
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Démarrage du script de correction JSX...\n');
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;
  let totalErrors = 0;

  // Traiter les fichiers prioritaires
  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixJSXTags(fullPath);
    if (result.fixed) {
      totalFixed++;
      totalErrors += result.errors.length;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   Fichiers corrigés: ${totalFixed}`);
  console.log(`   Erreurs corrigées: ${totalErrors}`);
  console.log(`\n✨ Correction terminée!`);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { fixJSXTags };




