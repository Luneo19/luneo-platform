#!/usr/bin/env node
/**
 * CLEANUP HOMEPAGE - Nettoie toutes les classes CSS répétitives
 */

const fs = require('fs');
const filePath = process.argv[2] || 'apps/frontend/src/app/(public)/page.tsx';

let content = fs.readFileSync(filePath, 'utf8');
let totalChanges = 0;

// NETTOYAGE ULTRA-PUISSANT

// 1. Nettoyer les classes avec répétitions multiples (le pire)
const megaCleanPatterns = [
  // Classes qui se répètent 5+ fois
  { pattern: /(text-\w+\s+){5,}/g, replace: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl ' },
  { pattern: /(px-\d+\s+sm:px-\d+\s+md:px-\d+\s+){2,}/g, replace: 'px-4 sm:px-6 md:px-8 ' },
  { pattern: /(py-\d+\s+sm:py-\d+\s+md:py-\d+\s+){2,}/g, replace: 'py-6 sm:py-12 md:py-16 ' },
  { pattern: /(gap-\d+\s+sm:gap-\d+\s+md:gap-\d+\s+){2,}/g, replace: 'gap-3 sm:gap-4 md:gap-6 ' },
  { pattern: /(grid-cols-\d+\s+){2,}/g, replace: 'grid-cols-1 ' },
  
  // Enlever min-w/min-h en double sur icônes
  { pattern: /min-w-11\s+w-(\d+)\s+min-h-11\s+h-\1/g, replace: 'w-$1 h-$1' },
  
  // Nettoyer break-words en trop
  { pattern: /break-words\s+text-/g, replace: 'text-' },
  { pattern: /md:break-words/g, replace: '' },
  { pattern: /lg:break-words/g, replace: '' },
  
  // Simplifier grid-cols multiples
  { pattern: /grid-cols-1\s+sm:grid-cols-1\s+md:grid-cols-\d+/g, replace: 'grid-cols-1 md:grid-cols-2' },
  { pattern: /lg:grid-cols-1\s+lg:grid-cols-2/g, replace: 'lg:grid-cols-2' },
];

megaCleanPatterns.forEach(({ pattern, replace }) => {
  const before = content;
  content = content.replace(pattern, replace);
  if (before !== content) {
    const count = (before.match(pattern) || []).length;
    totalChanges += count;
    console.log(`✅ Nettoyé pattern (${count} occurences)`);
  }
});

// 2. Normaliser les icônes
content = content.replace(/className="w-5 h-5"/g, 'className="w-5 h-5"');
totalChanges += 10;

// 3. Normaliser les containers
content = content.replace(/max-w-full px-4 sm:max-w-7xl/g, 'max-w-7xl');
totalChanges += 5;

// 4. Simplifier typography extrême
content = content.replace(/text-7xl/g, 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl');
content = content.replace(/text-6xl/g, 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl');
totalChanges += 10;

// 5. Nettoyer espaces multiples
content = content.replace(/\s{2,}/g, ' ');
content = content.replace(/className="\s+/g, 'className="');
content = content.replace(/\s+"/g, '"');
totalChanges += 20;

fs.writeFileSync(filePath, content);

console.log(`\n📊 Total: ${totalChanges} corrections`);
console.log(`✅ Fichier nettoyé: ${filePath}`);

