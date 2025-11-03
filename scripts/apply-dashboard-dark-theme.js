#!/usr/bin/env node
/**
 * Script automatisé - Applique dark theme à toutes les pages dashboard
 * Remplace les classes light par dark theme cohérent
 */

const fs = require('fs');
const path = require('path');

// Patterns de remplacement pour dark theme
const DARK_THEME_PATTERNS = [
  // Background principal
  { from: /className="([^"]*)\bmin-h-screen\b(?!\s+bg-gray-900)/g, to: 'className="$1min-h-screen bg-gray-900 text-white' },
  { from: /className="([^"]*)\bbg-white\b/g, to: 'className="$1bg-gray-800' },
  { from: /className="([^"]*)\bbg-gray-50\b/g, to: 'className="$1bg-gray-800/50' },
  { from: /className="([^"]*)\bbg-gray-100\b/g, to: 'className="$1bg-gray-800' },
  
  // Cards
  { from: /className="([^"]*)\bborder-gray-200\b/g, to: 'className="$1border-gray-700' },
  { from: /className="([^"]*)\bborder-gray-300\b/g, to: 'className="$1border-gray-700' },
  
  // Text
  { from: /className="([^"]*)\btext-gray-900\b/g, to: 'className="$1text-white' },
  { from: /className="([^"]*)\btext-gray-800\b/g, to: 'className="$1text-gray-100' },
  { from: /className="([^"]*)\btext-gray-700\b/g, to: 'className="$1text-gray-200' },
  { from: /className="([^"]*)\btext-gray-600\b/g, to: 'className="$1text-gray-300' },
  { from: /className="([^"]*)\btext-gray-500\b/g, to: 'className="$1text-gray-400' },
  
  // Hover states
  { from: /className="([^"]*)\bhover:bg-gray-50\b/g, to: 'className="$1hover:bg-gray-700' },
  { from: /className="([^"]*)\bhover:bg-gray-100\b/g, to: 'className="$1hover:bg-gray-700' },
  
  // Inputs & Forms
  { from: /className="([^"]*)\bbg-gray-50\b([^"]*)\bborder\b/g, to: 'className="$1bg-gray-900$2border border-gray-700' },
];

/**
 * Applique dark theme
 */
function applyDarkTheme(content) {
  let result = content;
  let changeCount = 0;
  
  DARK_THEME_PATTERNS.forEach(pattern => {
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
    const { content: newContent, changes } = applyDarkTheme(content);
    
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
    console.log('Usage: node apply-dashboard-dark-theme.js <file1> [file2] ...');
    process.exit(1);
  }
  
  console.log(`🎨 Application dark theme dashboard...\n`);
  
  let totalChanges = 0;
  
  args.forEach((file, i) => {
    const result = processFile(file);
    
    if (result.success) {
      totalChanges += result.changes;
      console.log(`${i + 1}. ✅ ${path.basename(file)} (${result.changes} changements)`);
    } else {
      console.log(`${i + 1}. ❌ ${path.basename(file)} (${result.error})`);
    }
  });
  
  console.log(`\n📊 Total: ${totalChanges} changements\n`);
  
  if (totalChanges > 0) {
    console.log('✅ Dark theme appliqué !');
  } else {
    console.log('ℹ️  Déjà en dark theme');
  }
}

module.exports = { applyDarkTheme, processFile };

