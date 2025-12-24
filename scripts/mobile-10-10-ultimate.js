#!/usr/bin/env node
/**
 * MOBILE 10/10 ULTIMATE - Corrections ultra-puissantes
 * Objectif: Score 10/10 mobile sur TOUTES les pages
 */

const fs = require('fs');
const path = require('path');

// Patterns ultra-puissants pour mobile 10/10
const ULTIMATE_MOBILE_PATTERNS = [
  // === TOUCH TARGETS 44px MINIMUM ===
  
  // Petits boutons → touch-friendly
  { from: /className="([^"]*)\bp-0\b/g, to: 'className="$1p-3' },
  { from: /className="([^"]*)\bp-1\b([^"]*(?:button|btn|click|touch))/gi, to: 'className="$1p-3 sm:p-1$2' },
  
  // Icons seuls → ajouter padding
  { from: /className="([^"]*)\b(w-4|w-5|w-6)\s+(h-4|h-5|h-6)\b(?!.*p-)/g, to: 'className="$1$2 $3 p-2' },
  
  // === GRIDS MOBILE-FIRST STRICT ===
  
  // Grid 2 cols sans mobile
  { from: /className="([^"]*)\bgrid\s+grid-cols-2\b(?!\s+sm:|\s+md:)/g, to: 'className="$1grid grid-cols-1 min-[480px]:grid-cols-2' },
  
  // Grid 3 cols sans mobile
  { from: /className="([^"]*)\bgrid\s+grid-cols-3\b(?!\s+grid-cols-1)/g, to: 'className="$1grid grid-cols-1 min-[480px]:grid-cols-2 min-[768px]:grid-cols-3' },
  
  // Grid 4 cols sans mobile
  { from: /className="([^"]*)\bgrid\s+grid-cols-4\b(?!\s+grid-cols-1)/g, to: 'className="$1grid grid-cols-1 min-[480px]:grid-cols-2 min-[1024px]:grid-cols-4' },
  
  // === FLEX RESPONSIVE ===
  
  // Flex row sans col mobile
  { from: /className="([^"]*)\bflex\b(?!\s+flex-col)([^"]*)\bspace-x-/g, to: 'className="$1flex flex-col sm:flex-row$2space-y-3 sm:space-y-0 sm:space-x-' },
  
  // Flex gap horizontal
  { from: /className="([^"]*)\bflex\s+gap-([4-9]|1[0-9])\b(?!.*flex-col)/g, to: 'className="$1flex flex-col sm:flex-row gap-3 sm:gap-$2' },
  
  // === TYPOGRAPHY ULTRA-RESPONSIVE ===
  
  // Très grands titres
  { from: /className="([^"]*)\btext-7xl\b(?!\s+text-3xl|\s+text-4xl)/g, to: 'className="$1text-3xl min-[480px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl' },
  { from: /className="([^"]*)\btext-6xl\b(?!\s+text-2xl|\s+text-3xl)/g, to: 'className="$1text-2xl min-[480px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl' },
  { from: /className="([^"]*)\btext-5xl\b(?!\s+text-xl|\s+text-2xl)/g, to: 'className="$1text-xl min-[480px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl' },
  
  // === PADDING ULTRA-RESPONSIVE ===
  
  // Padding XXL
  { from: /className="([^"]*)\bpx-24\b/g, to: 'className="$1px-4 min-[480px]:px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24' },
  { from: /className="([^"]*)\bpy-32\b/g, to: 'className="$1py-8 min-[480px]:py-12 sm:px-16 md:py-20 lg:py-24 xl:py-32' },
  { from: /className="([^"]*)\bpy-28\b/g, to: 'className="$1py-8 min-[480px]:py-12 sm:py-16 md:py-20 lg:py-28' },
  
  // === GAP ULTRA-RESPONSIVE ===
  
  // Gap XL
  { from: /className="([^"]*)\bgap-16\b/g, to: 'className="$1gap-4 min-[480px]:gap-6 sm:gap-8 md:gap-12 lg:gap-16' },
  { from: /className="([^"]*)\bgap-14\b/g, to: 'className="$1gap-4 min-[480px]:px-6 sm:gap-8 md:gap-10 lg:gap-14' },
  { from: /className="([^"]*)\bgap-12\b(?!\s+gap-3|\s+gap-4)/g, to: 'className="$1gap-3 min-[480px]:gap-4 sm:gap-6 md:gap-8 lg:gap-12' },
  
  // === SPACE ULTRA-RESPONSIVE ===
  
  // Space X
  { from: /className="([^"]*)\bspace-x-10\b/g, to: 'className="$1space-x-2 min-[480px]:space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-10' },
  { from: /className="([^"]*)\bspace-x-8\b(?!\s+space-x-2)/g, to: 'className="$1space-x-2 min-[480px]:space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8' },
  
  // Space Y  
  { from: /className="([^"]*)\bspace-y-16\b/g, to: 'className="$1space-y-6 min-[480px]:space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16' },
  { from: /className="([^"]*)\bspace-y-12\b(?!\s+space-y-4)/g, to: 'className="$1space-y-4 min-[480px]:space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12' },
  
  // === WIDTH RESPONSIVE ===
  
  // Max-width fixes
  { from: /className="([^"]*)\bmax-w-7xl\b/g, to: 'className="$1max-w-full px-4 sm:max-w-7xl sm:px-6' },
  { from: /className="([^"]*)\bmax-w-6xl\b/g, to: 'className="$1max-w-full px-4 sm:max-w-6xl sm:px-6' },
  { from: /className="([^"]*)\bmax-w-5xl\b/g, to: 'className="$1max-w-full px-4 sm:max-w-5xl sm:px-6' },
  
  // Container fixes
  { from: /className="([^"]*)\bcontainer\b(?!.*px-4)/g, to: 'className="$1container px-4 sm:px-6 lg:px-8' },
  
  // === OVERFLOW PREVENTION ===
  
  // Tables → scroll horizontal mobile
  { from: /<div([^>]*className="[^"]*)\btable\b/g, to: '<div$1overflow-x-auto table' },
  
  // Code blocks → scroll
  { from: /<pre([^>]*className="[^"]*)\b(?!.*overflow-x)/g, to: '<pre$1overflow-x-auto ' },
];

/**
 * Applique corrections ultimate
 */
function applyUltimateMobile(content) {
  let result = content;
  let changeCount = 0;
  
  ULTIMATE_MOBILE_PATTERNS.forEach(pattern => {
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
    const { content: newContent, changes } = applyUltimateMobile(content);
    
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
    console.log('Usage: node mobile-10-10-ultimate.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`📱 Corrections ULTIMATE mobile 10/10...\n`);
  
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
  
  console.log(`\n📊 Total: ${totalChanges} corrections\n`);
  console.log(`✅ ${filesModified} fichiers optimisés mobile 10/10 !`);
}

module.exports = { applyUltimateMobile, processFile };

