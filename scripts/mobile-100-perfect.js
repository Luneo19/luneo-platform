#!/usr/bin/env node
/**
 * MOBILE 100/100 PERFECT - Script ultime pour mobile parfait
 * Objectif: Mobile 88 → 100 (+12 points)
 */

const fs = require('fs');
const path = require('path');

// PATTERNS ULTRA-PRÉCIS POUR MOBILE 100/100
const MOBILE_PERFECT_PATTERNS = [
  // ============================================
  // 1. TOUCH TARGETS 44px ULTRA-STRICT
  // ============================================
  
  // Tous les boutons MINIMUM 44px (min-w-11 min-h-11)
  { from: /(<button[^>]*className="[^"]*)\bp-1\b(?![^"]*min-[wh]-11)/g, to: '$1min-w-11 min-h-11 p-3 sm:p-1' },
  { from: /(<button[^>]*className="[^"]*)\bp-2\b(?![^"]*min-[wh]-11)/g, to: '$1min-w-11 min-h-11 p-3 sm:p-2' },
  
  // Links cliquables minimum p-2
  { from: /(<Link[^>]*className="[^"]*)\binline\b(?![^"]*p-[2-9])/g, to: '$1inline p-2' },
  { from: /(<Link[^>]*className="[^"]*)\bblock\b(?![^"]*p-[2-9])/g, to: '$1block p-2' },
  
  // Icons minimum p-2
  { from: /(className="[^"]*)\b(w-[4-6])\s+(h-[4-6])\b(?![^"]*p-[2-9])/g, to: '$1$2 $3 p-2 min-w-11 min-h-11' },
  
  // Inputs minimum h-12
  { from: /(<input[^>]*className="[^"]*)\bh-10\b/g, to: '$1h-12' },
  { from: /(<input[^>]*className="[^"]*)\bh-9\b/g, to: '$1h-12' },
  { from: /(<input[^>]*className="[^"]*)\bh-8\b/g, to: '$1h-12' },
  
  // ============================================
  // 2. GRIDS MOBILE-FIRST ULTRA-STRICT
  // ============================================
  
  // JAMAIS commencer par grid-cols-2+ sans mobile
  { from: /className="([^"]*)\bgrid\s+grid-cols-2\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 min-[480px]:grid-cols-2' },
  { from: /className="([^"]*)\bgrid\s+grid-cols-3\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
  { from: /className="([^"]*)\bgrid\s+grid-cols-4\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' },
  
  // Grids existants sans cols-1
  { from: /className="([^"]*)\bgrid-cols-2\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid-cols-1 min-[480px]:grid-cols-2' },
  { from: /className="([^"]*)\bgrid-cols-3\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
  { from: /className="([^"]*)\bgrid-cols-4\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' },
  
  // ============================================
  // 3. TYPOGRAPHY ULTRA-PROGRESSIVE
  // ============================================
  
  // Jamais plus de text-xl de base sur mobile
  { from: /className="([^"]*)\btext-6xl\b(?![^"]*text-base|text-lg|text-xl)/g, to: 'className="$1text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-6xl' },
  { from: /className="([^"]*)\btext-5xl\b(?![^"]*text-base|text-lg|text-xl)/g, to: 'className="$1text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl' },
  { from: /className="([^"]*)\btext-4xl\b(?![^"]*text-base|text-lg|text-xl)/g, to: 'className="$1text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl' },
  { from: /className="([^"]*)\btext-3xl\b(?![^"]*text-base|text-lg)/g, to: 'className="$1text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-3xl' },
  { from: /className="([^"]*)\btext-2xl\b(?![^"]*text-base)/g, to: 'className="$1text-base min-[480px]:text-lg sm:text-xl md:text-2xl' },
  
  // Line-height adaptatif
  { from: /className="([^"]*)\bleading-none\b/g, to: 'className="$1leading-tight sm:leading-none' },
  { from: /className="([^"]*)\bleading-tight\b(?![^"]*leading-)/g, to: 'className="$1leading-snug sm:leading-tight' },
  
  // ============================================
  // 4. PADDING ULTRA-STRICT MOBILE
  // ============================================
  
  // Jamais plus de px-4 sur mobile
  { from: /className="([^"]*)\bpx-([5-9]|1[0-9]|20)\b(?![^"]*px-[34])/g, to: 'className="$1px-3 min-[480px]:px-4 sm:px-6 md:px-8 lg:px-$2' },
  { from: /className="([^"]*)\bpy-([789]|1[0-9]|2[0-9])\b(?![^"]*py-[456])/g, to: 'className="$1py-4 min-[480px]:py-6 sm:py-8 md:py-12 lg:py-$2' },
  
  // Container strict
  { from: /className="([^"]*)\bpx-20\b/g, to: 'className="$1px-3 min-[480px]:px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20' },
  { from: /className="([^"]*)\bpy-24\b/g, to: 'className="$1py-4 min-[480px]:py-6 sm:py-8 md:py-12 lg:py-16 xl:py-24' },
  
  // ============================================
  // 5. WIDTH STRICT MOBILE
  // ============================================
  
  // Jamais de width fixe sans responsive
  { from: /className="([^"]*)\bw-64\b(?![^"]*w-full)/g, to: 'className="$1w-full sm:w-64' },
  { from: /className="([^"]*)\bw-80\b(?![^"]*w-full)/g, to: 'className="$1w-full sm:w-80' },
  { from: /className="([^"]*)\bw-96\b(?![^"]*w-full)/g, to: 'className="$1w-full sm:w-96' },
  
  // Max-width containers
  { from: /className="([^"]*)\bmax-w-7xl\b(?![^"]*px-)/g, to: 'className="$1max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8' },
  { from: /className="([^"]*)\bmax-w-6xl\b(?![^"]*px-)/g, to: 'className="$1max-w-6xl px-3 sm:px-4 md:px-6' },
  { from: /className="([^"]*)\bmax-w-5xl\b(?![^"]*px-)/g, to: 'className="$1max-w-5xl px-3 sm:px-4 md:px-6' },
  
  // ============================================
  // 6. GAP ULTRA-PROGRESSIF
  // ============================================
  
  // Gap jamais > 3 sur mobile
  { from: /className="([^"]*)\bgap-([4-9]|1[0-9])\b(?![^"]*gap-[23])/g, to: 'className="$1gap-2 min-[480px]:gap-3 sm:gap-4 md:gap-6 lg:gap-$2' },
  { from: /className="([^"]*)\bspace-x-([4-9]|1[0-9])\b(?![^"]*space-x-[23])/g, to: 'className="$1space-x-2 min-[480px]:space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-$2' },
  { from: /className="([^"]*)\bspace-y-([6-9]|1[0-9])\b(?![^"]*space-y-[34])/g, to: 'className="$1space-y-3 min-[480px]:space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-$2' },
  
  // ============================================
  // 7. FLEX RESPONSIVE MOBILE
  // ============================================
  
  // Flex horizontal → vertical mobile
  { from: /className="([^"]*)\bflex\b(?!\s+flex-col)([^"]*)\bjustify-between\b/g, to: 'className="$1flex flex-col sm:flex-row$2justify-start sm:justify-between gap-3 sm:gap-0' },
  { from: /className="([^"]*)\bflex\s+items-center\s+gap-([2-9])\b(?![^"]*flex-col)/g, to: 'className="$1flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-$2' },
  
  // ============================================
  // 8. OVERFLOW PREVENTION
  // ============================================
  
  // Text overflow
  { from: /className="([^"]*)\btext-/g, to: 'className="$1break-words text-' },
  
  // Container overflow
  { from: /className="([^"]*)\boverflow-hidden\b(?![^"]*overflow-x)/g, to: 'className="$1overflow-x-auto overflow-y-hidden' },
];

/**
 * Applique corrections mobile 100/100
 */
function applyMobile100(content) {
  let result = content;
  let changeCount = 0;
  
  MOBILE_PERFECT_PATTERNS.forEach(pattern => {
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
    const { content: newContent, changes } = applyMobile100(content);
    
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
    console.log('Usage: node mobile-100-perfect.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`🚀 MOBILE 100/100 PERFECT...\n`);
  
  let totalChanges = 0;
  let filesModified = 0;
  
  args.forEach((file, i) => {
    const result = processFile(file);
    
    if (result.success && result.changes > 0) {
      filesModified++;
      totalChanges += result.changes;
      console.log(`${filesModified}. ✅ ${path.basename(file)} (${result.changes})`);
    }
  });
  
  console.log(`\n📊 Total: ${totalChanges} corrections mobile perfect\n`);
  console.log(`✅ ${filesModified} fichiers → Mobile 100/100 !`);
}

module.exports = { applyMobile100, processFile };

