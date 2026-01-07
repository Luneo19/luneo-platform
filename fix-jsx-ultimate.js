#!/usr/bin/env node

/**
 * Script ULTRA PERFORMANT pour corriger automatiquement toutes les balises JSX non fermées
 * Analyse syntaxique complète avec correction intelligente
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
 * Parse JSX de manière robuste en gérant les strings, commentaires, etc.
 */
function parseJSXRobust(content) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;
  let braceDepth = 0;
  let parenDepth = 0;
  
  while (i < content.length) {
    const char = content[i];
    const next = i + 1 < content.length ? content[i + 1] : '';
    const prev = i > 0 ? content[i - 1] : '';
    
    // Gérer les commentaires
    if (!inString && char === '/' && next === '/') {
      while (i < content.length && content[i] !== '\n') i++;
      if (i < content.length) { line++; col = 1; }
      continue;
    }
    if (!inString && char === '/' && next === '*') {
      inComment = true;
      i += 2;
      continue;
    }
    if (inComment && char === '*' && next === '/') {
      inComment = false;
      i += 2;
      continue;
    }
    if (inComment) {
      if (char === '\n') { line++; col = 1; } else col++;
      i++;
      continue;
    }
    
    // Gérer les strings
    if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
        inTemplate = (char === '`');
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
        inTemplate = false;
      }
      col++;
      i++;
      continue;
    }
    
    if (inString) {
      if (char === '\n') { line++; col = 1; } else col++;
      i++;
      continue;
    }
    
    // Détecter les balises JSX
    if (char === '<' && next !== '/' && next !== '!' && next !== '?') {
      const tagMatch = content.substring(i).match(/^<(\w+)([^>]*?)(\/?)>/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const attrs = tagMatch[2];
        const isSelfClosing = tagMatch[3] === '/' || attrs.trim().endsWith('/');
        
        tokens.push({
          type: 'open',
          tag: tagName,
          line,
          col,
          index: i,
          selfClosing: isSelfClosing,
          full: tagMatch[0]
        });
        
        i += tagMatch[0].length;
        col += tagMatch[0].length;
        continue;
      }
    }
    
    if (char === '<' && next === '/') {
      const tagMatch = content.substring(i).match(/^<\/(\w+)>/);
      if (tagMatch) {
        tokens.push({
          type: 'close',
          tag: tagMatch[1],
          line,
          col,
          index: i,
          full: tagMatch[0]
        });
        
        i += tagMatch[0].length;
        col += tagMatch[0].length;
        continue;
      }
    }
    
    // Suivre les parenthèses et accolades pour le contexte
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    
    if (char === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    i++;
  }
  
  return tokens;
}

/**
 * Trouve les balises non fermées
 */
function findUnclosedTags(tokens) {
  const stack = [];
  const unclosed = [];
  
  for (const token of tokens) {
    if (token.type === 'open' && !token.selfClosing) {
      stack.push(token);
    } else if (token.type === 'close') {
      // Trouver la balise ouvrante correspondante
      let found = false;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === token.tag) {
          stack.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) {
        // Balise fermante sans ouvrante - peut être une erreur mais on continue
      }
    }
  }
  
  return stack;
}

/**
 * Trouve la meilleure position pour insérer une balise fermante
 */
function findInsertPosition(content, startIndex, tagName) {
  const searchPatterns = [
    { pattern: /<\/div>/g, name: '</div>' },
    { pattern: /<\/CardContent>/g, name: '</CardContent>' },
    { pattern: /<\/Card>/g, name: '</Card>' },
    { pattern: /<\/DialogFooter>/g, name: '</DialogFooter>' },
    { pattern: /<\/Dialog>/g, name: '</Dialog>' },
    { pattern: /<\/Button>/g, name: '</Button>' },
    { pattern: /<\/Badge>/g, name: '</Badge>' },
    { pattern: /<\/TableCell>/g, name: '</TableCell>' },
    { pattern: /<\/TabsContent>/g, name: '</TabsContent>' },
    { pattern: /\)\s*\)/g, name: '))' },
    { pattern: /\)\s*\}/g, name: ')}' },
    { pattern: /^\s*\}\)/gm, name: '})' },
  ];
  
  let bestPos = -1;
  let bestLine = -1;
  let bestIndent = '';
  
  for (const { pattern, name } of searchPatterns) {
    pattern.lastIndex = startIndex;
    const match = pattern.exec(content);
    if (match && (bestPos === -1 || match.index < bestPos)) {
      bestPos = match.index;
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : content.length);
      const indentMatch = line.match(/^(\s*)/);
      bestIndent = indentMatch ? indentMatch[1] : '                        ';
      bestLine = content.substring(0, match.index).split('\n').length;
    }
  }
  
  // Si on ne trouve rien, chercher la fin du scope (parenthèse ou accolade fermante)
  if (bestPos === -1) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      const next = i + 1 < content.length ? content[i + 1] : '';
      const prev = i > 0 ? content[i - 1] : '';
      
      if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        continue;
      }
      
      if (inString) continue;
      
      if (char === '(') depth++;
      if (char === ')') {
        depth--;
        if (depth < 0) {
          bestPos = i;
          const lineStart = content.lastIndexOf('\n', i) + 1;
          const line = content.substring(lineStart, i);
          const indentMatch = line.match(/^(\s*)/);
          bestIndent = indentMatch ? indentMatch[1] : '                        ';
          bestLine = content.substring(0, i).split('\n').length;
          break;
        }
      }
    }
  }
  
  return { pos: bestPos, line: bestLine, indent: bestIndent };
}

/**
 * Corrige un fichier
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

  // Étape 1: Parser le JSX
  const tokens = parseJSXRobust(content);
  const unclosedTags = findUnclosedTags(tokens);
  
  if (unclosedTags.length > 0) {
    console.log(`   ⚠️  ${unclosedTags.length} balise(s) non fermée(s) détectée(s)`);
    
    // Trier par index décroissant pour insérer de la fin vers le début
    unclosedTags.sort((a, b) => b.index - a.index);
    
    for (const tag of unclosedTags) {
      console.log(`      - <${tag.tag}> à la ligne ${tag.line}`);
      errors.push(`Balise <${tag.tag}> non fermée à la ligne ${tag.line}`);
      
      // Trouver où insérer la balise fermante
      const insertInfo = findInsertPosition(content, tag.index + tag.full.length, tag.tag);
      
      if (insertInfo.pos !== -1) {
        const before = content.substring(0, insertInfo.pos).trimEnd();
        const after = content.substring(insertInfo.pos);
        content = before + '\n' + insertInfo.indent + `</${tag.tag}>` + after;
        fixed = true;
      }
    }
  }

  // Étape 2: Corriger les patterns spécifiques
  // Badge non fermés avant certains tags
  const badgeBeforeDiv = /<Badge([^>]*)>([^<]*?)(?=\s*<\/div>)/g;
  content = content.replace(badgeBeforeDiv, (match, attrs, inner) => {
    if (!match.includes('</Badge>')) {
      fixed = true;
      return `<Badge${attrs}>${inner}</Badge>`;
    }
    return match;
  });

  // Button non fermés avant DialogFooter
  const buttonBeforeDialogFooter = /<Button([^>]*)>([^<]*?)(?=\s*<\/DialogFooter>)/g;
  content = content.replace(buttonBeforeDialogFooter, (match, attrs, inner) => {
    if (!match.includes('</Button>')) {
      fixed = true;
      return `<Button${attrs}>${inner}</Button>`;
    }
    return match;
  });

  // Corriger return ( en double
  content = content.replace(/\s+return\s*\(\s*return\s*\(/g, ' return (');
  if (content !== originalContent) fixed = true;

  // Corriger les structures map avec const avant return
  content = content.replace(/\.map\([^)]*=>\s*\{?\s*return\s*\(\s*const\s+/g, (match) => {
    fixed = true;
    return match.replace(/\s+return\s*\(\s*/, ' ');
  });

  if (fixed && content !== originalContent) {
    // Backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    console.log(`💾 Backup créé: ${backupPath}`);
    
    // Sauvegarder
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé: ${filePath}`);
    console.log(`   Erreurs corrigées: ${errors.length}`);
  } else if (!fixed) {
    console.log(`✓ Aucune erreur détectée`);
  }

  return { fixed, errors };
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Script ULTRA PERFORMANT de correction JSX\n');
  console.log('='.repeat(60));
  
  const workspaceRoot = process.cwd();
  let totalFixed = 0;
  let totalErrors = 0;

  for (const filePath of PRIORITY_FILES) {
    const fullPath = path.join(workspaceRoot, filePath);
    const result = fixJSXTags(fullPath);
    if (result.fixed) {
      totalFixed++;
      totalErrors += result.errors.length;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RÉSUMÉ:`);
  console.log(`   ✅ Fichiers corrigés: ${totalFixed}/${PRIORITY_FILES.length}`);
  console.log(`   🔧 Erreurs corrigées: ${totalErrors}`);
  console.log(`\n✨ Correction terminée!`);
  console.log(`\n💡 Exécutez 'npm run build' pour vérifier les corrections.`);
}

if (require.main === module) {
  main();
}

module.exports = { fixJSXTags, parseJSXRobust };








