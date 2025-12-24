#!/usr/bin/env node

/**
 * Script pour remplacer toutes les balises <img> par OptimizedImage
 * Usage: node scripts/replace-img-tags.js
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

// Patterns à remplacer
const IMG_PATTERN = /<img\s+([^>]*?)>/g;

// Fichiers à ignorer
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /OptimizedImage\.tsx$/, // Ne pas modifier le composant lui-même
  /LazyImage\.tsx$/, // Ne pas modifier LazyImage
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
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

function parseImgAttributes(attrsString) {
  const attrs = {};
  const matches = attrsString.matchAll(/(\w+)=["']([^"']+)["']/g);
  
  for (const match of matches) {
    attrs[match[1]] = match[2];
  }
  
  return attrs;
}

function convertImgToOptimizedImage(imgTag, attrs) {
  const props = [];
  
  // Required props
  if (attrs.src) props.push(`src="${attrs.src}"`);
  if (attrs.alt) props.push(`alt="${attrs.alt}"`);
  else props.push(`alt=""`); // Required by Next.js Image
  
  // Optional props
  if (attrs.width) props.push(`width={${attrs.width}}`);
  if (attrs.height) props.push(`height={${attrs.height}}`);
  if (attrs.class || attrs.className) props.push(`className="${attrs.class || attrs.className}"`);
  if (attrs.style) props.push(`style={${attrs.style}}`);
  if (attrs.loading === 'eager' || attrs.loading === 'lazy') {
    props.push(`priority={${attrs.loading === 'eager'}}`);
  }
  
  return `<OptimizedImage ${props.join(' ')} />`;
}

function needsOptimizedImageImport(content) {
  return !/import.*OptimizedImage.*from/.test(content) && /<img\s/.test(content);
}

function addOptimizedImageImport(content, filePath) {
  // Déterminer le chemin relatif pour l'import
  const relativePath = path.relative(path.dirname(filePath), path.join(FRONTEND_SRC, 'components', 'optimized', 'OptimizedImage'));
  const importPath = relativePath.startsWith('.') 
    ? relativePath.replace(/\.tsx$/, '')
    : '@/components/optimized/OptimizedImage';
  
  const importStatement = `import OptimizedImage from '${importPath}';`;
  
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

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!/<img\s/.test(content)) {
      return { file: filePath, status: 'skipped', reason: 'No <img> tags found' };
    }
    
    let newContent = content;
    let modified = false;
    let needsImport = needsOptimizedImageImport(content);
    
    // Remplacer les balises <img>
    const matches = [...content.matchAll(IMG_PATTERN)];
    
    for (const match of matches) {
      const fullMatch = match[0];
      const attrsString = match[1];
      const attrs = parseImgAttributes(attrsString);
      
      // Ignorer les images dans les commentaires ou strings
      const beforeMatch = content.substring(0, match.index);
      const openComments = (beforeMatch.match(/\/\*/g) || []).length - (beforeMatch.match(/\*\//g) || []).length;
      const openStrings = (beforeMatch.match(/"/g) || []).length % 2;
      
      if (openComments > 0 || openStrings > 0) {
        continue;
      }
      
      const replacement = convertImgToOptimizedImage(fullMatch, attrs);
      newContent = newContent.replace(fullMatch, replacement);
      modified = true;
    }
    
    // Ajouter import si nécessaire
    if (needsImport && modified) {
      newContent = addOptimizedImageImport(newContent, filePath);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return { file: filePath, status: 'modified', needsImport, count: matches.length };
    }
    
    return { file: filePath, status: 'skipped', reason: 'No changes needed' };
  } catch (error) {
    return { file: filePath, status: 'error', error: error.message };
  }
}

function main() {
  console.log('🔍 Recherche des balises <img>...\n');
  
  const files = findFiles(FRONTEND_SRC);
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const results = {
    modified: [],
    skipped: [],
    errors: [],
  };
  
  for (const file of files) {
    const result = processFile(file);
    
    if (result.status === 'modified') {
      results.modified.push(result);
      console.log(`✅ ${path.relative(process.cwd(), result.file)} (${result.count} images)`);
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
  
  const totalImages = results.modified.reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`  📸 Images remplacées: ${totalImages}`);
  
  if (results.modified.length > 0) {
    console.log('\n✨ Remplacement terminé!');
    console.log('⚠️  Vérifiez les fichiers modifiés avant de commit.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles };

