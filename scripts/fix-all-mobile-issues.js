#!/usr/bin/env node
/**
 * FIX ALL MOBILE ISSUES - Correction complète mobile
 * Corrige: Documentation, Industries, Pricing, Homepage, Dashboard
 */

const fs = require('fs');
const path = require('path');

// PATTERNS COMPLETS POUR MOBILE 100%
const MOBILE_FIX_PATTERNS = [
  // ============================================
  // 1. ICÔNES - Enlever min-w-11 min-h-11
  // ============================================
  
  // Enlever min-w-11 min-h-11 des icônes
  { from: /min-w-11\s+w-(\d+)\s+min-h-11\s+h-\1/g, to: 'w-$1 h-$1' },
  
  // Icônes grandes (w-12) → responsive
  { from: /className="([^"]*)\bw-12\s+h-12\b(?![^"]*sm:w)/g, to: 'className="$1w-10 h-10 sm:w-12 sm:h-12' },
  
  // Icônes moyennes (w-8) → responsive
  { from: /className="([^"]*)\bw-8\s+h-8\b(?![^"]*sm:w)/g, to: 'className="$1w-6 h-6 sm:w-8 sm:h-8' },
  
  // Avatars (w-16) → responsive
  { from: /className="([^"]*)\bw-16\s+h-16\b(?![^"]*sm:w)/g, to: 'className="$1w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16' },
  
  // ============================================
  // 2. GRIDS - Mobile-first strict
  // ============================================
  
  // Grid cols-3 sans mobile
  { from: /className="([^"]*)\bgrid-cols-3\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
  
  // Grid cols-4 sans mobile
  { from: /className="([^"]*)\bgrid-cols-4\b(?![^"]*grid-cols-1)/g, to: 'className="$1grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' },
  
  // Grid cols-5 sans mobile
  { from: /className="([^"]*)\bgrid-cols-5\b(?![^"]*grid-cols-2)/g, to: 'className="$1grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' },
  
  // Grid cols-7 sans mobile
  { from: /className="([^"]*)\bgrid-cols-7\b(?![^"]*grid-cols-2)/g, to: 'className="$1grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7' },
  
  // ============================================
  // 3. PADDING - Progressive mobile-first
  // ============================================
  
  // Padding p-8
  { from: /className="([^"]*)\bp-8\b(?![^"]*p-4)/g, to: 'className="$1p-4 sm:p-6 md:p-8' },
  
  // Padding p-10
  { from: /className="([^"]*)\bp-10\b(?![^"]*p-4)/g, to: 'className="$1p-4 sm:p-6 md:p-8 lg:p-10' },
  
  // Padding horizontal
  { from: /className="([^"]*)\bpx-8\b(?![^"]*px-4)/g, to: 'className="$1px-4 sm:px-6 md:px-8' },
  
  // Padding vertical
  { from: /className="([^"]*)\bpy-20\b(?![^"]*py-12)/g, to: 'className="$1py-12 sm:py-16 md:py-20' },
  { from: /className="([^"]*)\bpy-16\b(?![^"]*py-8)/g, to: 'className="$1py-8 sm:py-12 md:py-16' },
  
  // ============================================
  // 4. GAP - Progressive mobile-first
  // ============================================
  
  { from: /className="([^"]*)\bgap-8\b(?![^"]*gap-4)/g, to: 'className="$1gap-4 sm:gap-6 md:gap-8' },
  { from: /className="([^"]*)\bgap-12\b(?![^"]*gap-6)/g, to: 'className="$1gap-6 sm:gap-8 md:gap-10 lg:gap-12' },
  { from: /className="([^"]*)\bgap-6\b(?![^"]*gap-3)/g, to: 'className="$1gap-3 sm:gap-4 md:gap-6' },
  
  // ============================================
  // 5. TYPOGRAPHY - Mobile-first
  // ============================================
  
  // Très gros titres
  { from: /className="([^"]*)\btext-5xl\b(?![^"]*text-3xl|text-2xl)/g, to: 'className="$1text-2xl sm:text-3xl md:text-4xl lg:text-5xl' },
  { from: /className="([^"]*)\btext-4xl\b(?![^"]*text-2xl|text-xl)/g, to: 'className="$1text-xl sm:text-2xl md:text-3xl lg:text-4xl' },
  { from: /className="([^"]*)\btext-3xl\b(?![^"]*text-xl)/g, to: 'className="$1text-lg sm:text-xl md:text-2xl lg:text-3xl' },
  
  // ============================================
  // 6. SPACE-X/Y - Progressive
  // ============================================
  
  { from: /className="([^"]*)\bspace-x-8\b(?![^"]*space-x-4)/g, to: 'className="$1space-x-4 sm:space-x-6 md:space-x-8' },
  { from: /className="([^"]*)\bspace-y-8\b(?![^"]*space-y-4)/g, to: 'className="$1space-y-4 sm:space-y-6 md:space-y-8' },
  { from: /className="([^"]*)\bspace-y-6\b(?![^"]*space-y-3)/g, to: 'className="$1space-y-3 sm:space-y-4 md:space-y-6' },
  
  // ============================================
  // 7. CONTAINERS - Max-width avec padding
  // ============================================
  
  { from: /className="([^"]*)\bmax-w-7xl\b(?![^"]*px-)/g, to: 'className="$1max-w-7xl px-4 sm:px-6 md:px-8' },
  { from: /className="([^"]*)\bmax-w-6xl\b(?![^"]*px-)/g, to: 'className="$1max-w-6xl px-4 sm:px-6' },
  { from: /className="([^"]*)\bmax-w-5xl\b(?![^"]*px-)/g, to: 'className="$1max-w-5xl px-4 sm:px-6' },
  { from: /className="([^"]*)\bmax-w-4xl\b(?![^"]*px-)/g, to: 'className="$1max-w-4xl px-4 sm:px-6' },
];

/**
 * Applique corrections
 */
function applyMobileFixes(content) {
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
    const { content: newContent, changes } = applyMobileFixes(content);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent);
      return { success: true, changes, file: path.basename(filePath) };
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
    console.log('Usage: node fix-all-mobile-issues.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`🚀 FIX ALL MOBILE ISSUES...\n`);
  
  let totalChanges = 0;
  let filesModified = 0;
  const results = [];
  
  args.forEach(file => {
    const result = processFile(file);
    
    if (result.success && result.changes > 0) {
      filesModified++;
      totalChanges += result.changes;
      results.push({ file: result.file, changes: result.changes });
    }
  });
  
  // Afficher top 10
  results.sort((a, b) => b.changes - a.changes).slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ✅ ${r.file} (${r.changes})`);
  });
  
  console.log(`\n📊 Total: ${totalChanges} corrections\n`);
  console.log(`✅ ${filesModified} fichiers corrigés!\n`);
}

module.exports = { applyMobileFixes, processFile };

