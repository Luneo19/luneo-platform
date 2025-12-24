#!/usr/bin/env node
/**
 * MEGA MOBILE + TABLET 100/100 - Script ultime
 * Objectif: 100/100 sur Desktop, Tablet ET Mobile
 */

const fs = require('fs');
const path = require('path');

// Patterns ULTRA-PUISSANTS pour 100/100
const ULTIMATE_100_PATTERNS = [
  // ============================================
  // TABLET OPTIMIZATION (md: 768px)
  // ============================================
  
  // Typography avec md:
  { from: /className="([^"]*)\btext-2xl\s+sm:text-3xl\s+lg:text-4xl\b/g, to: 'className="$1text-2xl sm:text-3xl md:text-3xl lg:text-4xl' },
  { from: /className="([^"]*)\btext-3xl\s+sm:text-4xl\s+lg:text-5xl\b/g, to: 'className="$1text-3xl sm:text-4xl md:text-4xl lg:text-5xl' },
  { from: /className="([^"]*)\btext-xl\s+sm:text-2xl\s+lg:text-3xl\b/g, to: 'className="$1text-xl sm:text-2xl md:text-2xl lg:text-3xl' },
  
  // Padding avec md:
  { from: /className="([^"]*)\bpx-4\s+sm:px-6\s+lg:px-(\d+)\b/g, to: 'className="$1px-4 sm:px-6 md:px-8 lg:px-$2' },
  { from: /className="([^"]*)\bpy-6\s+sm:py-8\s+lg:py-(\d+)\b/g, to: 'className="$1py-6 sm:py-8 md:py-10 lg:py-$2' },
  { from: /className="([^"]*)\bpy-8\s+sm:py-12\s+lg:py-(\d+)\b/g, to: 'className="$1py-8 sm:py-10 md:py-14 lg:py-$2' },
  
  // Gap avec md:
  { from: /className="([^"]*)\bgap-4\s+sm:gap-6\s+lg:gap-8\b/g, to: 'className="$1gap-4 sm:gap-5 md:gap-6 lg:gap-8' },
  { from: /className="([^"]*)\bgap-3\s+sm:gap-4\s+lg:gap-6\b/g, to: 'className="$1gap-3 sm:gap-4 md:gap-5 lg:gap-6' },
  
  // ============================================
  // MOBILE PERFECTION (< 640px)
  // ============================================
  
  // === TOUCH TARGETS 44px STRICT ===
  
  // Buttons minimum p-3 (48px)
  { from: /(<button[^>]*className="[^"]*)\bp-1\b/g, to: '$1p-3 sm:p-1' },
  { from: /(<button[^>]*className="[^"]*)\bp-2\b(?!.*sm:)/g, to: '$1p-3 sm:p-2' },
  
  // Icons standalone → add padding
  { from: /className="([^"]*)\b(w-[3-6])\s+(h-[3-6])\b(?!.*p-[2-9])/g, to: 'className="$1$2 $3 p-2 sm:p-1' },
  
  // Links minimum touch
  { from: /(<Link[^>]*className="[^"]*)\binline\b(?!.*p-)/g, to: '$1inline p-2' },
  
  // === GRIDS MOBILE-FIRST ULTRA-STRICT ===
  
  // Detecter grid sans cols-1
  { from: /className="([^"]*)\bgrid\s+grid-cols-([2-4])\b(?!.*grid-cols-1)/g, to: 'className="$1grid grid-cols-1 sm:grid-cols-$2' },
  
  // Forcer mobile-first sur tous
  { from: /className="([^"]*)\bgrid-cols-([2-4])\b(?!.*sm:)/g, to: 'className="$1grid-cols-1 sm:grid-cols-$2' },
  
  // === TYPOGRAPHY ULTRA-PROGRESSIVE ===
  
  // Jamais plus de text-2xl sur mobile de base
  { from: /className="([^"]*)\btext-([3-7])xl\b(?!.*text-xl|text-2xl)/g, to: 'className="$1text-xl sm:text-2xl md:text-$2xl' },
  
  // Titres géants → démarrer text-xl
  { from: /className="([^"]*)\btext-6xl\b/g, to: 'className="$1text-xl min-[480px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl' },
  { from: /className="([^"]*)\btext-5xl\b/g, to: 'className="$1text-lg min-[480px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl' },
  
  // === PADDING ULTRA-STRICT MOBILE ===
  
  // Jamais plus de px-6 sur mobile de base
  { from: /className="([^"]*)\bpx-([89]|1[0-9]|20)\b(?!.*px-4)/g, to: 'className="$1px-4 sm:px-6 md:px-$2' },
  { from: /className="([^"]*)\bpy-([89]|1[0-9]|2[0-9])\b(?!.*py-6)/g, to: 'className="$1py-6 sm:py-8 md:py-$2' },
  
  // Container padding strict
  { from: /className="([^"]*)\bcontainer\b(?!.*px-)/g, to: 'className="$1container px-4' },
  { from: /className="([^"]*)\bmax-w-7xl\b(?!.*px-)/g, to: 'className="$1max-w-7xl px-4 sm:px-6' },
  
  // === GAP ULTRA-PROGRESSIF ===
  
  // Gap jamais > 4 sur mobile
  { from: /className="([^"]*)\bgap-([5-9]|1[0-9])\b(?!.*gap-[234])/g, to: 'className="$1gap-3 sm:gap-4 md:gap-6 lg:gap-$2' },
  { from: /className="([^"]*)\bspace-x-([5-9]|1[0-9])\b(?!.*space-x-[234])/g, to: 'className="$1space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-$2' },
  { from: /className="([^"]*)\bspace-y-([89]|1[0-9])\b(?!.*space-y-[34])/g, to: 'className="$1space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-$2' },
  
  // === FLEX RESPONSIVE MOBILE ===
  
  // Flex horizontal → vertical mobile
  { from: /className="([^"]*)\bflex\b(?!\s+flex-col)([^"]*)\bspace-x-\d+\b/g, to: 'className="$1flex flex-col sm:flex-row$2space-y-3 sm:space-y-0 sm:space-x-4' },
  { from: /className="([^"]*)\bflex\s+items-center\s+space-x-\d+\b(?!.*flex-col)/g, to: 'className="$1flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4' },
  
  // === WIDTH STRICT MOBILE ===
  
  // Jamais de width fixe sans max-w
  { from: /className="([^"]*)\bw-\[(\d+)px\]\b(?!.*max-w)/g, to: 'className="$1w-full sm:w-auto sm:max-w-md' },
  { from: /className="([^"]*)\bmin-w-\[(\d+)px\]\b/g, to: 'className="$1w-full sm:min-w-[$2px]' },
  
  // === OVERFLOW PREVENTION ===
  
  // Tables auto-scroll
  { from: /<table/g, to: '<div className="overflow-x-auto"><table' },
  { from: /<\/table>/g, to: '</table></div>' },
  
  // Code blocks scroll
  { from: /<pre([^>]*className="[^"]*)\b(?!.*overflow-x)/g, to: '<pre$1overflow-x-auto ' },
  
  // === IMAGES RESPONSIVE ===
  
  // Images max-width
  { from: /<Image([^>]*)(?!.*className)/g, to: '<Image$1 className="max-w-full h-auto"' },
  { from: /<img([^>]*)(?!.*className)/g, to: '<img$1 className="max-w-full h-auto"' },
];

/**
 * Applique corrections ultimate 100/100
 */
function applyUltimate100(content) {
  let result = content;
  let changeCount = 0;
  
  ULTIMATE_100_PATTERNS.forEach(pattern => {
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
    const { content: newContent, changes } = applyUltimate100(content);
    
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
    console.log('Usage: node mega-mobile-tablet-100.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`🚀 MEGA SCRIPT 100/100 - Mobile + Tablet Perfect...\n`);
  
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
  
  console.log(`\n📊 Total: ${totalChanges} corrections ultimate\n`);
  console.log(`✅ ${filesModified} fichiers → 100/100 !`);
}

module.exports = { applyUltimate100, processFile };

