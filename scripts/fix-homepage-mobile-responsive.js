#!/usr/bin/env node
/**
 * FIX HOMEPAGE MOBILE RESPONSIVE
 * Nettoie et optimise la homepage pour mobile
 */

const fs = require('fs');

const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node fix-homepage-mobile-responsive.js <file>');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// 1. Nettoyer les classes CSS répétitives
const cleanRepeatedClasses = [
  // Nettoyer px répétitifs
  { from: /px-\d+\s+sm:px-\d+\s+md:px-\d+\s+sm:px-\d+\s+md:px-\d+\s+sm:px-\d+/g, to: 'px-4 sm:px-6 md:px-8' },
  { from: /py-\d+\s+sm:py-\d+\s+md:py-\d+\s+sm:py-\d+\s+md:py-\d+\s+sm:py-\d+/g, to: 'py-6 sm:py-12 md:py-16' },
  
  // Nettoyer gap répétitifs
  { from: /gap-\d+\s+sm:gap-\d+\s+md:gap-\d+\s+sm:gap-\d+\s+md:gap-\d+\s+sm:gap-\d+/g, to: 'gap-3 sm:gap-4 md:gap-6' },
  
  // Nettoyer text-size répétitifs
  { from: /text-\w+\s+sm:text-\w+\s+md:text-\w+\s+sm:text-\w+\s+md:text-\w+\s+sm:text-\w+\s+md:text-\w+\s+lg:text-\w+/g, to: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl' },
];

cleanRepeatedClasses.forEach(({ from, to }) => {
  const before = content;
  content = content.replace(from, to);
  if (before !== content) changes++;
});

// 2. Simplifier classes min-w-11/min-h-11 pour icônes
content = content.replace(/min-w-11\s+w-(\d+)\s+min-h-11\s+h-\1/g, 'w-$1 h-$1');
changes++;

// 3. Remplacer inline p-2-flex par inline-flex
content = content.replace(/inline p-2-flex/g, 'inline-flex');
changes++;

// 4. Nettoyer break-words en double
content = content.replace(/break-words\s+text-/g, 'text-');
changes++;

// 5. Simplifier grid-cols répétitifs
content = content.replace(/grid-cols-\d+\s+md:grid-cols-\d+\s+md:grid-cols-\d+\s+md:grid-cols-\d+/g, 'grid-cols-1 lg:grid-cols-2');
changes++;

fs.writeFileSync(filePath, content);

console.log(`✅ ${changes} corrections appliquées`);
console.log(`✅ Fichier nettoyé: ${filePath}`);

