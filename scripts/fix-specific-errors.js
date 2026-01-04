#!/usr/bin/env node

/**
 * Script de correction ciblée pour les fichiers avec erreurs critiques
 * Corrige les erreurs identifiées dans le rapport d'analyse
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Fichiers avec erreurs critiques identifiés
const CRITICAL_FILES = [
  'ai-studio/animations/page.tsx',
  'ai-studio/3d/page.tsx',
  'ai-studio/templates/page.tsx',
  'integrations/page.tsx',
  'ar-studio/preview/page.tsx',
  'analytics/page.tsx'
];

function fixCriticalFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  // Correction 1: Supprimer les fermetures pour composants auto-fermants
  const selfClosing = ['Separator', 'Progress', 'Checkbox', 'Input', 'Textarea'];
  selfClosing.forEach(comp => {
    const pattern = new RegExp(`</${comp}>`, 'g');
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        lines[idx] = line.replace(pattern, '');
        modified = true;
      }
    });
  });
  
  // Correction 2: Corriger les déséquilibres Button
  const buttonOpen = [];
  const buttonClose = [];
  lines.forEach((line, idx) => {
    if (line.includes('<Button') && !line.includes('</Button>') && !line.includes('/>')) {
      buttonOpen.push(idx);
    }
    if (line.includes('</Button>')) {
      buttonClose.push(idx);
    }
  });
  
  if (buttonClose.length > buttonOpen.length) {
    const excess = buttonClose.length - buttonOpen.length;
    // Retirer les fermetures en trop (de la fin vers le début)
    for (let i = 0; i < excess && buttonClose.length > 0; i++) {
      const lineIdx = buttonClose.pop();
      if (lineIdx < lines.length) {
        const original = lines[lineIdx];
        lines[lineIdx] = original.replace(/<\/Button>/g, '');
        if (lines[lineIdx].trim() !== original.trim()) {
          modified = true;
        }
        if (!lines[lineIdx].trim()) {
          lines.splice(lineIdx, 1);
          modified = true;
        }
      }
    }
  }
  
  // Correction 3: Corriger les déséquilibres Card
  const cardOpen = [];
  const cardClose = [];
  lines.forEach((line, idx) => {
    if (line.includes('<Card') && !line.includes('</Card>') && !line.includes('<CardContent') && !line.includes('<CardHeader')) {
      cardOpen.push(idx);
    }
    if (line.includes('</Card>')) {
      cardClose.push(idx);
    }
  });
  
  if (cardClose.length > cardOpen.length) {
    const excess = cardClose.length - cardOpen.length;
    for (let i = 0; i < excess && cardClose.length > 0; i++) {
      const lineIdx = cardClose.pop();
      if (lineIdx < lines.length) {
        const original = lines[lineIdx];
        lines[lineIdx] = original.replace(/<\/Card>/g, '');
        if (lines[lineIdx].trim() !== original.trim()) {
          modified = true;
        }
        if (!lines[lineIdx].trim()) {
          lines.splice(lineIdx, 1);
          modified = true;
        }
      }
    }
  }
  
  // Correction 4: Corriger les déséquilibres div
  const divOpen = [];
  const divClose = [];
  lines.forEach((line, idx) => {
    if (line.includes('<div') && !line.includes('</div>')) {
      divOpen.push(idx);
    }
    if (line.includes('</div>')) {
      divClose.push(idx);
    }
  });
  
  if (divClose.length > divOpen.length) {
    const excess = divClose.length - divOpen.length;
    // Retirer intelligemment les fermetures en trop
    for (let i = 0; i < excess && divClose.length > 0; i++) {
      // Préférer retirer les fermetures seules sur une ligne
      let found = false;
      for (let j = divClose.length - 1; j >= 0; j--) {
        const lineIdx = divClose[j];
        if (lineIdx < lines.length) {
          const trimmed = lines[lineIdx].trim();
          if (trimmed === '</div>' || trimmed.endsWith('</div>') && !trimmed.startsWith('</div>')) {
            lines[lineIdx] = lines[lineIdx].replace(/<\/div>/g, '');
            if (!lines[lineIdx].trim()) {
              lines.splice(lineIdx, 1);
            }
            divClose.splice(j, 1);
            modified = true;
            found = true;
            break;
          }
        }
      }
      if (!found && divClose.length > 0) {
        const lineIdx = divClose.pop();
        if (lineIdx < lines.length) {
          lines[lineIdx] = lines[lineIdx].replace(/<\/div>/g, '');
          if (!lines[lineIdx].trim()) {
            lines.splice(lineIdx, 1);
          }
          modified = true;
        }
      }
    }
  }
  
  // Correction 5: Corriger les déséquilibres Badge
  const badgeOpen = [];
  const badgeClose = [];
  lines.forEach((line, idx) => {
    if (line.includes('<Badge') && !line.includes('</Badge>')) {
      badgeOpen.push(idx);
    }
    if (line.includes('</Badge>')) {
      badgeClose.push(idx);
    }
  });
  
  if (badgeClose.length > badgeOpen.length) {
    const excess = badgeClose.length - badgeOpen.length;
    for (let i = 0; i < excess && badgeClose.length > 0; i++) {
      const lineIdx = badgeClose.pop();
      if (lineIdx < lines.length) {
        lines[lineIdx] = lines[lineIdx].replace(/<\/Badge>/g, '');
        if (!lines[lineIdx].trim()) {
          lines.splice(lineIdx, 1);
        }
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Correction ciblée des fichiers critiques...\n');
  
  let fixedCount = 0;
  
  CRITICAL_FILES.forEach(relativePath => {
    const filePath = path.join(DASHBOARD_DIR, relativePath);
    if (fs.existsSync(filePath)) {
      const fixed = fixCriticalFile(filePath);
      if (fixed) {
        fixedCount++;
        console.log(`✅ ${relativePath}`);
      } else {
        console.log(`⏭️  ${relativePath} (pas de corrections nécessaires)`);
      }
    } else {
      console.log(`⚠️  ${relativePath} (fichier non trouvé)`);
    }
  });
  
  console.log(`\n📊 ${fixedCount} fichier(s) critique(s) corrigé(s)\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixCriticalFile };







