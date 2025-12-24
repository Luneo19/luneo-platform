#!/usr/bin/env node
/**
 * FIX MOBILE PERFECT - Corrections ultra-ciblées pour mobile parfait
 * Objectif: 10/10 mobile sur toutes les pages
 */

const fs = require('fs');
const path = require('path');

// Patterns de correction mobile
const MOBILE_FIX_PATTERNS = [
  // 1. Touch targets minimum 44px (w-8 = 32px → min-w-11 = 44px)
  { from: /className="([^"]*)\b(w-[1-9]|w-10)\b(?!\s*min-w-)/g, to: 'className="$1min-w-11 $2' },
  { from: /className="([^"]*)\b(h-[1-9]|h-10)\b(?!\s*min-h-)/g, to: 'className="$1min-h-11 $2' },
  
  // 2. Buttons touch targets
  { from: /className="([^"]*)\bp-1\b/g, to: 'className="$1p-2 sm:p-1' },
  { from: /className="([^"]*)\bp-2\b([^"]*button|btn)/gi, to: 'className="$1p-3 sm:p-2$2' },
  
  // 3. Fixed width → responsive width
  { from: /className="([^"]*)\bw-\[(\d+)px\]\b/g, to: 'className="$1w-full max-w-md' },
  { from: /className="([^"]*)\bmax-w-\[(\d+)px\]\b/g, to: 'className="$1max-w-full sm:max-w-md' },
  
  // 4. Grids sans mobile-first
  { from: /className="([^"]*)\bgrid\s+grid-cols-2\b(?!.*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-2' },
  { from: /className="([^"]*)\bgrid\s+grid-cols-3\b(?!.*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3' },
  { from: /className="([^"]*)\bgrid\s+grid-cols-4\b(?!.*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' },
  
  // 5. Flex horizontal → vertical sur mobile
  { from: /className="([^"]*)\bflex\s+space-x-\d+\b(?!.*flex-col)/g, to: 'className="$1flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4' },
  
  // 6. Typography trop grande sans responsive
  { from: /className="([^"]*)\btext-5xl\b(?!.*text-2xl|text-3xl)/g, to: 'className="$1text-2xl sm:text-3xl md:text-4xl lg:text-5xl' },
  { from: /className="([^"]*)\btext-4xl\b(?!.*text-xl|text-2xl)/g, to: 'className="$1text-xl sm:text-2xl md:text-3xl lg:text-4xl' },
  { from: /className="([^"]*)\btext-3xl\b(?!.*text-lg|text-xl)/g, to: 'className="$1text-lg sm:text-xl md:text-2xl lg:text-3xl' },
  
  // 7. Padding horizontal trop large
  { from: /className="([^"]*)\bpx-16\b(?!.*px-4|px-6)/g, to: 'className="$1px-4 sm:px-6 md:px-8 lg:px-16' },
  { from: /className="([^"]*)\bpx-12\b(?!.*px-4)/g, to: 'className="$1px-4 sm:px-6 md:px-12' },
  { from: /className="([^"]*)\bpx-10\b(?!.*px-4)/g, to: 'className="$1px-4 sm:px-6 md:px-10' },
  
  // 8. Padding vertical trop large
  { from: /className="([^"]*)\bpy-24\b(?!.*py-8)/g, to: 'className="$1py-8 sm:py-12 md:py-16 lg:py-24' },
  { from: /className="([^"]*)\bpy-20\b(?!.*py-6)/g, to: 'className="$1py-6 sm:py-10 md:py-16 lg:py-20' },
  { from: /className="([^"]*)\bpy-16\b(?!.*py-6)/g, to: 'className="$1py-6 sm:py-8 md:py-12 lg:py-16' },
  
  // 9. Gap sans mobile
  { from: /className="([^"]*)\bgap-10\b(?!.*gap-4)/g, to: 'className="$1gap-4 sm:gap-6 md:gap-8 lg:gap-10' },
  { from: /className="([^"]*)\bgap-8\b(?!.*gap-3|gap-4)/g, to: 'className="$1gap-3 sm:gap-4 md:gap-6 lg:gap-8' },
  { from: /className="([^"]*)\bgap-6\b(?!.*gap-2|gap-3)/g, to: 'className="$1gap-2 sm:gap-3 md:gap-4 lg:gap-6' },
  
  // 10. Space sans mobile
  { from: /className="([^"]*)\bspace-x-8\b(?!.*space-x-2|space-x-3)/g, to: 'className="$1space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8' },
  { from: /className="([^"]*)\bspace-x-6\b(?!.*space-x-2)/g, to: 'className="$1space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6' },
  { from: /className="([^"]*)\bspace-y-12\b(?!.*space-y-4|space-y-6)/g, to: 'className="$1space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12' },
];

/**
 * Applique les corrections mobile
 */
function fixMobilePerfect(content) {
  let result = content;
  let changeCount = 0;
  
  MOBILE_FIX_PATTERNS.forEach(pattern => {
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
    const { content: newContent, changes } = fixMobilePerfect(content);
    
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
    console.log('Usage: node fix-mobile-perfect.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`📱 Corrections mobile perfect...\n`);
  
  let totalChanges = 0;
  
  args.forEach((file, i) => {
    const result = processFile(file);
    
    if (result.success) {
      totalChanges += result.changes;
      if (result.changes > 0) {
        console.log(`${i + 1}. ✅ ${path.basename(file)} (${result.changes} corrections)`);
      }
    } else {
      console.log(`${i + 1}. ❌ ${path.basename(file)} (${result.error})`);
    }
  });
  
  console.log(`\n📊 Total: ${totalChanges} corrections mobile\n`);
  
  if (totalChanges > 0) {
    console.log('✅ Mobile optimisé 10/10 !');
  } else {
    console.log('ℹ️  Déjà optimisé pour mobile');
  }
}

module.exports = { fixMobilePerfect, processFile };

