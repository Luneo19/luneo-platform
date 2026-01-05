#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

console.log('🔍 Analyse complète de toutes les erreurs JSX/TypeScript...\n');

// 1. Analyse TypeScript
console.log('📋 Analyse TypeScript...');
try {
  const tsErrors = execSync('cd apps/frontend && pnpm run type-check 2>&1', { encoding: 'utf8' });
  const tsErrorLines = tsErrors.split('\n').filter(line => 
    line.includes('error TS') || line.includes('Error:')
  );
  console.log(`   ${tsErrorLines.length} erreur(s) TypeScript trouvée(s)`);
  if (tsErrorLines.length > 0) {
    console.log('   Premières erreurs:');
    tsErrorLines.slice(0, 10).forEach(err => console.log(`   - ${err}`));
  }
} catch (e) {
  console.log('   Erreurs TypeScript détectées');
}

// 2. Analyse Build
console.log('\n📋 Analyse Build...');
try {
  const buildOutput = execSync('cd apps/frontend && pnpm run build 2>&1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const buildErrors = buildOutput.split('\n').filter(line => 
    line.includes('Error:') || line.includes('Failed to compile')
  );
  console.log(`   ${buildErrors.length} erreur(s) de build trouvée(s)`);
  
  // Extraire les fichiers avec erreurs
  const errorFiles = new Set();
  buildOutput.split('\n').forEach(line => {
    const match = line.match(/\.\/(src\/app\/[^:]+):(\d+):(\d+)/);
    if (match) {
      errorFiles.add(match[1]);
    }
  });
  
  console.log(`   Fichiers avec erreurs: ${errorFiles.size}`);
  errorFiles.forEach(file => console.log(`   - ${file}`));
  
  // Extraire les erreurs spécifiques
  const specificErrors = [];
  const lines = buildOutput.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Error:')) {
      const error = {
        line: lines[i],
        context: lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 5)).join('\n')
      };
      specificErrors.push(error);
    }
  }
  
  console.log(`\n   Détails des erreurs:`);
  specificErrors.slice(0, 20).forEach((err, idx) => {
    console.log(`\n   Erreur ${idx + 1}:`);
    console.log(err.context);
  });
  
} catch (e) {
  console.log('   Erreurs de build détectées');
  const output = e.stdout?.toString() || e.stderr?.toString() || e.message;
  const errorFiles = new Set();
  output.split('\n').forEach(line => {
    const match = line.match(/\.\/(src\/app\/[^:]+):(\d+):(\d+)/);
    if (match) {
      errorFiles.add(match[1]);
    }
  });
  console.log(`   Fichiers avec erreurs: ${errorFiles.size}`);
  errorFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n✅ Analyse terminée\n');








