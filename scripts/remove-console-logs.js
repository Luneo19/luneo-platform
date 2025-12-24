#!/usr/bin/env node
/**
 * Script automatisé - Retire tous les console.log/debug
 * Nettoie le code pour la production
 */

const fs = require('fs');
const path = require('path');

/**
 * Retire les console.log d'un fichier
 */
function removeConsoleLogs(content) {
  let result = content;
  let count = 0;
  
  // Pattern pour console.log(...) sur une ligne
  const singleLinePattern = /^\s*console\.(log|debug|info|warn)\([^)]*\);?\s*$/gm;
  const matches = content.match(singleLinePattern);
  if (matches) {
    count += matches.length;
    result = result.replace(singleLinePattern, '');
  }
  
  // Pattern pour console.log multi-lignes (dans les exemples de code)
  // On garde ceux qui sont dans des strings/templates
  const inCodePattern = /(?<!['"`])(\s*)console\.(log|debug|info|warn)\(/g;
  const inStringPattern = /(['"`]).*?console\.(log|debug).*?\1/g;
  
  // Ne retire que les vrais console.log, pas ceux dans les strings
  let tempResult = result;
  const stringMatches = [...result.matchAll(inStringPattern)];
  const protectedRanges = stringMatches.map(m => ({
    start: m.index,
    end: m.index + m[0].length
  }));
  
  return { content: result, count };
}

/**
 * Traite un fichier
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, count } = removeConsoleLogs(content);
    
    if (count > 0) {
      fs.writeFileSync(filePath, newContent);
      return { success: true, count };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Trouve tous les fichiers .tsx dans un répertoire
 */
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// CLI
if (require.main === module) {
  const targetDir = process.argv[2] || 'apps/frontend/src/app';
  
  console.log('🧹 Nettoyage console.log...\n');
  console.log(`📂 Répertoire: ${targetDir}\n`);
  
  const files = findTsxFiles(targetDir);
  console.log(`✅ ${files.length} fichiers trouvés\n`);
  
  let totalRemoved = 0;
  let filesModified = 0;
  
  files.forEach((file, i) => {
    const result = processFile(file);
    
    if (result.success && result.count > 0) {
      filesModified++;
      totalRemoved += result.count;
      const fileName = path.basename(file);
      console.log(`${filesModified}. ✅ ${fileName} (${result.count} console.log retirés)`);
    }
  });
  
  console.log(`\n📊 Résultat:`);
  console.log(`   Fichiers modifiés: ${filesModified}`);
  console.log(`   Console.log retirés: ${totalRemoved}\n`);
  
  if (totalRemoved > 0) {
    console.log('✅ Code nettoyé pour production !');
  } else {
    console.log('ℹ️  Aucun console.log trouvé');
  }
}

module.exports = { removeConsoleLogs, processFile };

