#!/usr/bin/env node

/**
 * Script d'analyse JSX pour identifier les balises manquantes/en trop
 * Analyse tous les fichiers de dashboard et génère un rapport détaillé
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Tags JSX à vérifier
const JSX_TAGS = [
  'div', 'Card', 'Button', 'Dialog', 'Badge', 'Input', 'Textarea',
  'Select', 'Tabs', 'Table', 'Form', 'Label', 'Progress', 'Separator',
  'ScrollArea', 'Checkbox', 'DropdownMenu', 'ErrorBoundary'
];

// Tags auto-fermants (ne nécessitent pas de fermeture)
const SELF_CLOSING_TAGS = [
  'img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base',
  'col', 'embed', 'source', 'track', 'wbr'
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const errors = [];
  const tagStack = [];
  const tagCounts = {};
  
  // Initialiser les compteurs
  JSX_TAGS.forEach(tag => {
    tagCounts[tag] = { open: 0, close: 0 };
  });
  
  // Analyser ligne par ligne
  lines.forEach((line, lineNum) => {
    const lineNumber = lineNum + 1;
    
    // Ignorer les commentaires
    if (line.trim().startsWith('//') || line.includes('{/*')) {
      return;
    }
    
    // Vérifier chaque tag
    JSX_TAGS.forEach(tag => {
      // Tags d'ouverture
      const openPattern = new RegExp(`<${tag}(?:\\s+[^>]*)?>`, 'g');
      const openMatches = line.match(openPattern);
      if (openMatches) {
        openMatches.forEach(() => {
          tagCounts[tag].open++;
          tagStack.push({ tag, line: lineNumber, type: 'open' });
        });
      }
      
      // Tags de fermeture
      const closePattern = new RegExp(`</${tag}>`, 'g');
      const closeMatches = line.match(closePattern);
      if (closeMatches) {
        closeMatches.forEach(() => {
          tagCounts[tag].close++;
          
          // Vérifier si la fermeture correspond à l'ouverture
          let found = false;
          for (let i = tagStack.length - 1; i >= 0; i--) {
            if (tagStack[i].tag === tag && tagStack[i].type === 'open') {
              tagStack.splice(i, 1);
              found = true;
              break;
            }
          }
          
          if (!found) {
            errors.push({
              type: 'unmatched_close',
              tag,
              line: lineNumber,
              message: `Balise fermante </${tag}> sans balise ouvrante correspondante`
            });
          }
        });
      }
    });
  });
  
  // Vérifier les tags non fermés
  tagStack.forEach(({ tag, line }) => {
    errors.push({
      type: 'unclosed',
      tag,
      line,
      message: `Balise ouvrante <${tag}> non fermée (ligne ${line})`
    });
  });
  
  // Vérifier les déséquilibres
  JSX_TAGS.forEach(tag => {
    const diff = tagCounts[tag].open - tagCounts[tag].close;
    if (diff !== 0) {
      errors.push({
        type: 'imbalance',
        tag,
        open: tagCounts[tag].open,
        close: tagCounts[tag].close,
        diff,
        message: `Déséquilibre ${tag}: ${tagCounts[tag].open} ouvertures, ${tagCounts[tag].close} fermetures (différence: ${diff})`
      });
    }
  });
  
  return {
    file: filePath,
    errors,
    tagCounts,
    hasErrors: errors.length > 0
  };
}

function findDashboardFiles(dir) {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
  }
  
  walkDir(dir);
  return files;
}

function main() {
  console.log('🔍 Analyse de la structure JSX des fichiers dashboard...\n');
  
  const files = findDashboardFiles(DASHBOARD_DIR);
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const results = [];
  let totalErrors = 0;
  
  files.forEach(file => {
    const result = analyzeFile(file);
    results.push(result);
    
    if (result.hasErrors) {
      totalErrors += result.errors.length;
      const relativePath = path.relative(DASHBOARD_DIR, file);
      console.log(`❌ ${relativePath}: ${result.errors.length} erreur(s)`);
      
      result.errors.forEach(error => {
        console.log(`   - Ligne ${error.line || 'N/A'}: ${error.message}`);
      });
      console.log('');
    }
  });
  
  // Générer un rapport
  const report = {
    totalFiles: files.length,
    filesWithErrors: results.filter(r => r.hasErrors).length,
    totalErrors,
    details: results.filter(r => r.hasErrors).map(r => ({
      file: path.relative(DASHBOARD_DIR, r.file),
      errors: r.errors,
      tagCounts: r.tagCounts
    }))
  };
  
  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '../jsx-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   Fichiers analysés: ${files.length}`);
  console.log(`   Fichiers avec erreurs: ${report.filesWithErrors}`);
  console.log(`   Total d'erreurs: ${totalErrors}`);
  console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}\n`);
  
  // Identifier les erreurs récurrentes
  const errorPatterns = {};
  results.forEach(result => {
    result.errors.forEach(error => {
      const key = `${error.type}_${error.tag || 'unknown'}`;
      if (!errorPatterns[key]) {
        errorPatterns[key] = { count: 0, files: [] };
      }
      errorPatterns[key].count++;
      if (!errorPatterns[key].files.includes(result.file)) {
        errorPatterns[key].files.push(result.file);
      }
    });
  });
  
  const recurringErrors = Object.entries(errorPatterns)
    .filter(([_, data]) => data.count > 1)
    .sort(([_, a], [__, b]) => b.count - a.count);
  
  if (recurringErrors.length > 0) {
    console.log('🔄 ERREURS RÉCURRENTES:');
    recurringErrors.forEach(([pattern, data]) => {
      console.log(`   ${pattern}: ${data.count} occurrences dans ${data.files.length} fichier(s)`);
    });
    console.log('');
  }
  
  return report;
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findDashboardFiles, main };










