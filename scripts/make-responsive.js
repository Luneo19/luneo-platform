#!/usr/bin/env node
/**
 * Script automatisé - Rend les pages responsive
 * Applique les breakpoints Tailwind sur tous les éléments non-responsive
 */

const fs = require('fs');
const path = require('path');

// Patterns de remplacement pour responsive
const RESPONSIVE_PATTERNS = [
  // Typography
  { from: /className="([^"]*)\btext-7xl\b/g, to: 'className="$1text-4xl sm:text-5xl md:text-6xl lg:text-7xl' },
  { from: /className="([^"]*)\btext-6xl\b/g, to: 'className="$1text-3xl sm:text-4xl md:text-5xl lg:text-6xl' },
  { from: /className="([^"]*)\btext-5xl\b/g, to: 'className="$1text-3xl sm:text-4xl md:text-5xl' },
  { from: /className="([^"]*)\btext-4xl\b/g, to: 'className="$1text-2xl sm:text-3xl md:text-4xl' },
  { from: /className="([^"]*)\btext-3xl\b/g, to: 'className="$1text-xl sm:text-2xl md:text-3xl' },
  { from: /className="([^"]*)\btext-2xl\b/g, to: 'className="$1text-lg sm:text-xl md:text-2xl' },
  
  // Grid 4 cols
  { from: /className="([^"]*)\bgrid-cols-4\b/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' },
  { from: /className="([^"]*)\bgrid-cols-3\b/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
  { from: /className="([^"]*)\bgrid-cols-2\b/g, to: 'className="$1grid-cols-1 md:grid-cols-2' },
  
  // Padding horizontal larges
  { from: /className="([^"]*)\bpx-20\b/g, to: 'className="$1px-4 sm:px-6 md:px-8 lg:px-20' },
  { from: /className="([^"]*)\bpx-16\b/g, to: 'className="$1px-4 sm:px-6 md:px-8 lg:px-16' },
  { from: /className="([^"]*)\bpx-12\b/g, to: 'className="$1px-4 sm:px-6 md:px-12' },
  { from: /className="([^"]*)\bpx-10\b/g, to: 'className="$1px-4 sm:px-6 md:px-10' },
  { from: /className="([^"]*)\bpx-8\b([^"])/g, to: 'className="$1px-4 sm:px-6 md:px-8$2' },
  
  // Padding vertical larges
  { from: /className="([^"]*)\bpy-32\b/g, to: 'className="$1py-12 sm:py-16 md:py-24 lg:py-32' },
  { from: /className="([^"]*)\bpy-24\b/g, to: 'className="$1py-8 sm:py-12 md:py-16 lg:py-24' },
  { from: /className="([^"]*)\bpy-20\b/g, to: 'className="$1py-8 sm:py-12 md:py-16 lg:py-20' },
  { from: /className="([^"]*)\bpy-16\b/g, to: 'className="$1py-6 sm:py-8 md:px-12 lg:py-16' },
  
  // Gap
  { from: /className="([^"]*)\bgap-12\b/g, to: 'className="$1gap-4 sm:gap-6 md:gap-8 lg:gap-12' },
  { from: /className="([^"]*)\bgap-10\b/g, to: 'className="$1gap-4 sm:gap-6 md:gap-8 lg:gap-10' },
  { from: /className="([^"]*)\bgap-8\b([^"])/g, to: 'className="$1gap-4 sm:gap-6 md:gap-8$2' },
  { from: /className="([^"]*)\bgap-6\b([^"])/g, to: 'className="$1gap-3 sm:gap-4 md:gap-6$2' },
  
  // Width fixes
  { from: /className="([^"]*)\bw-\[500px\]\b/g, to: 'className="$1w-full max-w-md' },
  { from: /className="([^"]*)\bw-\[600px\]\b/g, to: 'className="$1w-full max-w-lg' },
  { from: /className="([^"]*)\bw-\[700px\]\b/g, to: 'className="$1w-full max-w-xl' },
  { from: /className="([^"]*)\bw-\[800px\]\b/g, to: 'className="$1w-full max-w-2xl' },
  
  // Space
  { from: /className="([^"]*)\bspace-x-8\b/g, to: 'className="$1space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8' },
  { from: /className="([^"]*)\bspace-x-6\b/g, to: 'className="$1space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6' },
  { from: /className="([^"]*)\bspace-y-16\b/g, to: 'className="$1space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16' },
  { from: /className="([^"]*)\bspace-y-12\b/g, to: 'className="$1space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12' },
];

/**
 * Applique les patterns responsive
 */
function makeResponsive(content) {
  let result = content;
  let changeCount = 0;
  
  RESPONSIVE_PATTERNS.forEach(pattern => {
    const before = result;
    result = result.replace(pattern.from, pattern.to);
    if (before !== result) {
      const matches = (before.match(pattern.from) || []).length;
      changeCount += matches;
    }
  });
  
  return { content: result, changes: changeCount };
}

/**
 * Traite un fichier
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, changes } = makeResponsive(content);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent);
      return { success: true, changes };
    }
    
    return { success: true, changes: 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node make-responsive.js <file1> [file2] [file3] ...');
    console.log('\nExemple:');
    console.log('  node make-responsive.js apps/frontend/src/app/(public)/page.tsx');
    process.exit(1);
  }
  
  console.log(`🚀 Traitement de ${args.length} fichier(s)...\n`);
  
  let totalChanges = 0;
  const results = [];
  
  args.forEach((file, i) => {
    const result = processFile(file);
    results.push({ file, ...result });
    
    if (result.success) {
      totalChanges += result.changes;
      console.log(`${i + 1}. ✅ ${path.basename(file)} (${result.changes} changements)`);
    } else {
      console.log(`${i + 1}. ❌ ${path.basename(file)} (erreur: ${result.error})`);
    }
  });
  
  console.log(`\n📊 Total: ${totalChanges} changements appliqués\n`);
  
  if (totalChanges > 0) {
    console.log('✅ Fichiers rendus responsive !');
  } else {
    console.log('ℹ️  Aucun changement nécessaire (déjà responsive)');
  }
}

module.exports = { makeResponsive, processFile };

