#!/usr/bin/env node

/**
 * Script ultra performant pour corriger automatiquement toutes les balises JSX non fermées
 * Utilise une analyse syntaxique avancée pour détecter et corriger les erreurs
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

/**
 * Parse le contenu JSX et détecte les balises non fermées
 */
function parseJSX(content) {
  const fixes = [];
  const lines = content.split('\n');
  
  // Patterns pour détecter les balises
  const tagPattern = /<(\/?)(\w+)([^>]*?)(\/?)>/g;
  
  // Stack pour suivre les balises ouvertes
  const stack = [];
  const tagPositions = [];
  
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;
  
  // Analyser caractère par caractère pour éviter les faux positifs dans les strings
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = i + 1 < line.length ? line[i + 1] : '';
      const prevChar = i > 0 ? line[i - 1] : '';
      
      // Gérer les commentaires
      if (char === '/' && nextChar === '/' && !inString) {
        break; // Fin de ligne pour commentaire
      }
      if (char === '/' && nextChar === '*' && !inString) {
        inComment = true;
        i += 2;
        continue;
      }
      if (inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i += 2;
        continue;
      }
      if (inComment) {
        i++;
        continue;
      }
      
      // Gérer les strings
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
          if (char === '`') inTemplate = true;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
          inTemplate = false;
        }
        i++;
        continue;
      }
      
      if (inString) {
        i++;
        continue;
      }
      
      // Détecter les balises ouvrantes
      if (char === '<' && nextChar !== '/' && nextChar !== '!' && nextChar !== '?') {
        const tagMatch = line.substring(i).match(/^<(\w+)([^>]*?)(\/?)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          const attrs = tagMatch[2];
          const isSelfClosing = tagMatch[3] === '/' || 
                               attrs.trim().endsWith('/') ||
                               ['img', 'br', 'hr', 'input', 'Image'].includes(tagName);
          
          if (!isSelfClosing) {
            stack.push({
              tag: tagName,
              line: lineNum + 1,
              col: i,
              fullMatch: tagMatch[0]
            });
          }
          i += tagMatch[0].length;
          continue;
        }
      }
      
      // Détecter les balises fermantes
      if (char === '<' && nextChar === '/') {
        const tagMatch = line.substring(i).match(/^<\/(\w+)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          // Trouver la balise ouvrante correspondante
          let found = false;
          for (let j = stack.length - 1; j >= 0; j--) {
            if (stack[j].tag === tagName) {
              stack.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            // Balise fermante sans ouvrante - peut être une erreur mais on l'ignore
          }
          i += tagMatch[0].length;
          continue;
        }
      }
      
      i++;
    }
  }
  
  return { stack, fixes };
}

/**
 * Corrige les balises non fermées détectées
 */
function fixUnclosedTags(content, unclosedTags) {
  if (unclosedTags.length === 0) return content;
  
  const lines = content.split('\n');
  let fixedContent = content;
  
  // Trier par ligne décroissante pour insérer de la fin vers le début
  const sortedTags = [...unclosedTags].sort((a, b) => b.line - a.line);
  
  for (const tagInfo of sortedTags) {
    const lineNum = tagInfo.line - 1;
    if (lineNum >= lines.length) continue;
    
    const line = lines[lineNum];
    
    // Trouver où insérer la balise fermante
    // Chercher le prochain tag fermant ou la fin du scope
    let insertPos = -1;
    let insertLine = lineNum;
    
    // Chercher dans les lignes suivantes
    for (let i = lineNum + 1; i < lines.length; i++) {
      const nextLine = lines[i];
      
      // Patterns pour trouver où insérer
      const patterns = [
        /<\/div>/,
        /<\/CardContent>/,
        /<\/Card>/,
        /<\/DialogFooter>/,
        /<\/Dialog>/,
        /<\/Button>/,
        /<\/Badge>/,
        /<\/TableCell>/,
        /<\/TabsContent>/,
        /\)\s*\)/,
        /\)\s*\}/,
        /^\s*\}\)/,
      ];
      
      for (const pattern of patterns) {
        const match = nextLine.match(pattern);
        if (match) {
          insertPos = match.index;
          insertLine = i;
          break;
        }
      }
      
      if (insertPos !== -1) break;
      
      // Si on trouve un return ou une fermeture de fonction, insérer avant
      if (nextLine.match(/^\s*\}\)/) || nextLine.match(/^\s*return\s/)) {
        insertLine = i;
        insertPos = 0;
        break;
      }
    }
    
    if (insertPos === -1 && insertLine === lineNum) {
      // Si on ne trouve rien, insérer à la fin de la ligne actuelle
      insertLine = lineNum;
      insertPos = line.length;
    }
    
    // Calculer l'indentation
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '                        ';
    
    // Insérer la balise fermante
    if (insertLine === lineNum) {
      // Même ligne
      const before = line.substring(0, insertPos).trimEnd();
      const after = line.substring(insertPos);
      lines[insertLine] = before + '\n' + indent + `</${tagInfo.tag}>` + after;
    } else {
      // Ligne différente
      const targetLine = lines[insertLine];
      const before = targetLine.substring(0, insertPos).trimEnd();
      const after = targetLine.substring(insertPos);
      lines[insertLine] = before + '\n' + indent + `</${tagInfo.tag}>` + after;
    }
  }
  
  return lines.join('\n');
}

/**
 * Corrige les patterns spécifiques connus
 */
function fixKnownPatterns(content) {
  let fixed = content;
  let changed = false;
  
  // 1. Corriger les Badge non fermés avant </div>, </CardContent>, etc.
  const badgePatterns = [
    {
      // Badge avant </div>
      pattern: /<Badge([^>]*)>([^<]*?)(?=\s*<\/div>)/g,
      replacement: (match, attrs, content) => {
        if (!match.includes('</Badge>')) {
          changed = true;
          return `<Badge${attrs}>${content}</Badge>`;
        }
        return match;
      }
    },
    {
      // Badge avant </CardContent>
      pattern: /<Badge([^>]*)>([^<]*?)(?=\s*<\/CardContent>)/g,
      replacement: (match, attrs, content) => {
        if (!match.includes('</Badge>')) {
          changed = true;
          return `<Badge${attrs}>${content}</Badge>`;
        }
        return match;
      }
    },
    {
      // Badge avant )}
      pattern: /<Badge([^>]*)>([^<]*?)(?=\s*\)\s*\))/g,
      replacement: (match, attrs, content) => {
        if (!match.includes('</Badge>')) {
          changed = true;
          return `<Badge${attrs}>${content}</Badge>`;
        }
        return match;
      }
    }
  ];
  
  for (const { pattern, replacement } of badgePatterns) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  // 2. Corriger les Button non fermés avant </DialogFooter>
  fixed = fixed.replace(
    /<Button([^>]*)>([^<]*?)(?=\s*<\/DialogFooter>)/g,
    (match, attrs, content) => {
      if (!match.includes('</Button>')) {
        changed = true;
        return `<Button${attrs}>${content}</Button>`;
      }
      return match;
    }
  );
  
  // 3. Corriger les return ( en double
  fixed = fixed.replace(/\s+return\s*\(\s*return\s*\(/g, ' return (');
  
  // 4. Corriger les structures map avec const avant return
  fixed = fixed.replace(
    /\.map\([^)]*=>\s*\{?\s*return\s*\(\s*const\s+/g,
    '.map($& => { const '
  );
  
  // 5. Corriger les Badge avec contenu sur plusieurs lignes
  fixed = fixed.replace(
    /<Badge([^>]*)>\s*\n\s*([^<]+?)\s*\n\s*(?=<\/div>|<\/CardContent>|<\/Card>|\)\s*\))/g,
    (match, attrs, content) => {
      if (!match.includes('</Badge>')) {
        changed = true;
        const indent = match.match(/^(\s*)/)[1];
        return `<Badge${attrs}>\n${indent}  ${content.trim()}\n${indent}</Badge>`;
      }
      return match;
    }
  );
  
  return { content: fixed, changed };
}

/**
 * Fonction principale de correction
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

  // Étape 1: Corriger les patterns connus
  const patternResult = fixKnownPatterns(content);
  if (patternResult.changed) {
    content = patternResult.content;
    fixed = true;
    errors.push('Patterns connus corrigés');
  }

  // Étape 2: Parser et détecter les balises non fermées
  const parseResult = parseJSX(content);
  
  if (parseResult.stack.length > 0) {
    console.log(`   ⚠️  ${parseResult.stack.length} balise(s) non fermée(s) détectée(s)`);
    parseResult.stack.forEach(tag => {
      console.log(`      - <${tag.tag}> à la ligne ${tag.line}`);
      errors.push(`Balise <${tag.tag}> non fermée à la ligne ${tag.line}`);
    });
    
    // Corriger les balises non fermées
    content = fixUnclosedTags(content, parseResult.stack);
    fixed = true;
  }

  // Étape 3: Vérifications finales spécifiques
  // Badge non fermés
  const badgeOpenCount = (content.match(/<Badge[^>]*>/g) || []).length;
  const badgeCloseCount = (content.match(/<\/Badge>/g) || []).length;
  if (badgeOpenCount > badgeCloseCount) {
    const missing = badgeOpenCount - badgeCloseCount;
    console.log(`   ⚠️  ${missing} Badge(s) manquant(s)`);
    errors.push(`${missing} Badge(s) non fermé(s)`);
  }

  // Button non fermés
  const buttonOpenCount = (content.match(/<Button[^>]*>/g) || []).length;
  const buttonCloseCount = (content.match(/<\/Button>/g) || []).length;
  if (buttonOpenCount > buttonCloseCount) {
    const missing = buttonOpenCount - buttonCloseCount;
    console.log(`   ⚠️  ${missing} Button(s) manquant(s)`);
    errors.push(`${missing} Button(s) non fermé(s)`);
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
  } else if (!fixed) {
    console.log(`✓ Aucune erreur détectée`);
  }

  return { fixed, errors };
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Démarrage du script de correction JSX avancé...\n');
  
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
  console.log(`\n💡 Exécutez 'npm run build' pour vérifier les corrections.`);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { fixJSXTags, parseJSX, fixKnownPatterns };




