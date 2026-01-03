#!/usr/bin/env node
/**
 * Script pour analyser et corriger systématiquement les erreurs JSX
 * Basé sur les erreurs TypeScript réelles
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || 'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx';
const fullPath = path.join(__dirname, '..', filePath);

console.log(`Analyse de ${fullPath}...\n`);

// Obtenir les erreurs TypeScript
let tsErrors = [];
try {
  const output = execSync(
    `cd ${path.join(__dirname, '..', 'apps/frontend')} && npx tsc --noEmit 2>&1`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  const lines = output.split('\n');
  tsErrors = lines
    .filter(line => line.includes(filePath.split('/').pop()) && line.includes('error TS'))
    .map(line => {
      const match = line.match(/\((\d+),\d+\): error TS(\d+): (.+)/);
      if (match) {
        return {
          line: parseInt(match[1]),
          code: match[2],
          message: match[3]
        };
      }
      return null;
    })
    .filter(Boolean);
} catch (e) {
  console.error('Erreur lors de la récupération des erreurs TypeScript');
  process.exit(1);
}

// Grouper les erreurs par type
const unclosedTags = tsErrors.filter(e => 
  e.message.includes('has no corresponding closing tag') || 
  e.message.includes('Expected corresponding JSX closing tag')
);

console.log(`\n📊 Statistiques:`);
console.log(`   Total erreurs: ${tsErrors.length}`);
console.log(`   Balises non fermées: ${unclosedTags.length}\n`);

// Lire le fichier
let content = fs.readFileSync(fullPath, 'utf-8');
const lines = content.split('\n');

// Afficher les 20 premières erreurs pour référence
console.log('🔍 Premières erreurs détectées:\n');
unclosedTags.slice(0, 20).forEach((error, idx) => {
  console.log(`${idx + 1}. Ligne ${error.line}: ${error.message}`);
  if (lines[error.line - 1]) {
    console.log(`   ${lines[error.line - 1].trim().substring(0, 80)}...`);
  }
  console.log();
});

console.log(`\n💡 Utilisez ces informations pour corriger manuellement les erreurs.`);
console.log(`💡 Les erreurs TypeScript sont plus précises qu'un parser JSX simple.\n`);

// Compter les erreurs par ligne
const errorsByLine = {};
unclosedTags.forEach(err => {
  errorsByLine[err.line] = (errorsByLine[err.line] || 0) + 1;
});

const topErrorLines = Object.entries(errorsByLine)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([line, count]) => ({ line: parseInt(line), count }));

console.log('🔥 Lignes avec le plus d\'erreurs:');
topErrorLines.forEach(({ line, count }) => {
  console.log(`   Ligne ${line}: ${count} erreur(s)`);
});
