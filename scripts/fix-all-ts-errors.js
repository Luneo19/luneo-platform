#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const errors = [
  { file: 'ab-testing/page.tsx', line: 5091, fix: 'div' },
  { file: 'affiliate/page.tsx', line: 709, fix: 'CardContent' },
  { file: 'affiliate/page.tsx', line: 1722, fix: 'div' },
  { file: 'affiliate/page.tsx', line: 4943, fix: 'div' },
  { file: 'ai-studio/2d/page.tsx', line: 1135, fix: 'Button' },
  { file: 'ai-studio/2d/page.tsx', line: 1235, fix: 'Button' },
];

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

console.log('🔧 Correction de toutes les erreurs TypeScript identifiées...\n');

errors.forEach(({ file, line, fix }) => {
  const filePath = path.join(dashboardPath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} (fichier non trouvé)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  if (line <= lines.length) {
    const targetLine = lines[line - 1];
    console.log(`📝 ${file}:${line} - ${fix}`);
    console.log(`   Avant: ${targetLine.trim()}`);
    
    // Chercher la balise ouvrante correspondante
    let openTagFound = false;
    for (let i = line - 2; i >= 0 && i >= line - 50; i--) {
      const currentLine = lines[i];
      if (currentLine.includes(`<${fix}`) && !currentLine.includes(`</${fix}>`)) {
        // Vérifier si elle est fermée après
        const afterLines = lines.slice(i + 1, line);
        if (!afterLines.join('\n').includes(`</${fix}>`)) {
          // Insérer la balise fermante avant la ligne problématique
          lines.splice(line - 1, 0, `${' '.repeat(targetLine.match(/^(\s*)/)[1].length)}</${fix}>`);
          openTagFound = true;
          console.log(`   ✅ Balise </${fix}> ajoutée`);
          break;
        }
      }
    }
    
    if (!openTagFound) {
      // Essayer de fermer la balise sur la ligne même
      if (targetLine.includes(`<${fix}`) && !targetLine.includes(`</${fix}>`)) {
        const newLine = targetLine.replace(/(\{[^}]*\})\s*$/, `$1</${fix}>`);
        lines[line - 1] = newLine;
        console.log(`   ✅ Balise </${fix}> ajoutée sur la ligne`);
      }
    }
    
    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`   ✅ ${file} corrigé\n`);
    } else {
      console.log(`   ⏭️  ${file} (pas de correction nécessaire)\n`);
    }
  }
});

console.log('✅ Corrections terminées');







