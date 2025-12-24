#!/usr/bin/env node

/**
 * Script pour remplacer tous les console.log par logger
 * Usage: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');
const BACKEND_SRC = path.join(__dirname, '../apps/backend/src');

// Patterns à remplacer
const REPLACEMENTS = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    import: "import { logger } from '@/lib/logger';",
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    import: "import { logger } from '@/lib/logger';",
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    import: "import { logger } from '@/lib/logger';",
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    import: "import { logger } from '@/lib/logger';",
  },
];

// Fichiers à ignorer
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /logger\.ts$/, // Ne pas modifier le logger lui-même
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (shouldIgnore(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function hasConsoleLogs(content) {
  return /console\.(log|error|warn|debug)\(/.test(content);
}

function needsLoggerImport(content) {
  return !/import.*logger.*from/.test(content) && hasConsoleLogs(content);
}

function addLoggerImport(content, filePath) {
  // Déterminer le chemin relatif pour l'import
  const relativePath = path.relative(path.dirname(filePath), path.join(FRONTEND_SRC, 'lib', 'logger'));
  const importPath = relativePath.startsWith('.') 
    ? relativePath.replace(/\.ts$/, '')
    : '@/lib/logger';
  
  const importStatement = `import { logger } from '${importPath}';`;
  
  // Trouver la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s+/.test(lines[i])) {
      lastImportIndex = i;
    } else if (lastImportIndex >= 0 && lines[i].trim() === '') {
      break;
    }
  }
  
  // Vérifier si l'import existe déjà
  if (content.includes(importStatement)) {
    return content;
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    lines.unshift(importStatement, '');
  }
  
  return lines.join('\n');
}

function replaceConsoleLogs(content) {
  let newContent = content;
  let modified = false;
  
  for (const { pattern, replacement } of REPLACEMENTS) {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      modified = true;
    }
  }
  
  return { content: newContent, modified };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!hasConsoleLogs(content)) {
      return { file: filePath, status: 'skipped', reason: 'No console.log found' };
    }
    
    let newContent = content;
    let needsImport = needsLoggerImport(content);
    
    // Remplacer console.log
    const { content: replacedContent, modified } = replaceConsoleLogs(newContent);
    newContent = replacedContent;
    
    // Ajouter import si nécessaire
    if (needsImport && modified) {
      newContent = addLoggerImport(newContent, filePath);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return { file: filePath, status: 'modified', needsImport };
    }
    
    return { file: filePath, status: 'skipped', reason: 'No changes needed' };
  } catch (error) {
    return { file: filePath, status: 'error', error: error.message };
  }
}

function main() {
  console.log('🔍 Recherche des fichiers avec console.log...\n');
  
  const frontendFiles = findFiles(FRONTEND_SRC);
  const backendFiles = findFiles(BACKEND_SRC);
  const allFiles = [...frontendFiles, ...backendFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  const results = {
    modified: [],
    skipped: [],
    errors: [],
  };
  
  for (const file of allFiles) {
    const result = processFile(file);
    
    if (result.status === 'modified') {
      results.modified.push(result);
      console.log(`✅ ${path.relative(process.cwd(), result.file)}`);
    } else if (result.status === 'error') {
      results.errors.push(result);
      console.log(`❌ ${path.relative(process.cwd(), result.file)}: ${result.error}`);
    } else {
      results.skipped.push(result);
    }
  }
  
  console.log('\n📊 Résumé:');
  console.log(`  ✅ Modifiés: ${results.modified.length}`);
  console.log(`  ⏭️  Ignorés: ${results.skipped.length}`);
  console.log(`  ❌ Erreurs: ${results.errors.length}`);
  
  if (results.modified.length > 0) {
    console.log('\n✨ Remplacement terminé!');
    console.log('⚠️  Vérifiez les fichiers modifiés avant de commit.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles };

