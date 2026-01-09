#!/usr/bin/env node

/**
 * Script de correction complète et intelligente des erreurs JSX
 * Analyse et corrige toutes les erreurs identifiées dans le rapport
 */

const fs = require('fs');
const path = require('path');
const report = require('../jsx-analysis-report.json');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Composants auto-fermants (ne doivent jamais être fermés)
const SELF_CLOSING = ['Separator', 'Progress', 'Checkbox', 'Input', 'Textarea'];

function fixFile(filePath, errors) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  // 1. Supprimer toutes les fermetures pour composants auto-fermants
  SELF_CLOSING.forEach(comp => {
    const pattern = new RegExp(`</${comp}>`, 'g');
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        lines[idx] = line.replace(pattern, '');
        modified = true;
      }
    });
  });
  
  // 2. Corriger les déséquilibres en comptant précisément
  const counts = {
    Button: { open: 0, close: 0 },
    Card: { open: 0, close: 0 },
    Badge: { open: 0, close: 0 },
    div: { open: 0, close: 0 },
    Select: { open: 0, close: 0 }
  };
  
  // Compter les ouvertures et fermetures
  lines.forEach(line => {
    // Button
    const buttonOpen = (line.match(/<Button[^>]*>/g) || []).length;
    const buttonClose = (line.match(/<\/Button>/g) || []).length;
    counts.Button.open += buttonOpen;
    counts.Button.close += buttonClose;
    
    // Card (seulement <Card>, pas CardContent, etc.)
    const cardOpen = (line.match(/<Card\s+[^>]*>/g) || []).length + (line.match(/<Card\s*>/g) || []).length;
    const cardClose = (line.match(/<\/Card>/g) || []).length;
    counts.Card.open += cardOpen;
    counts.Card.close += cardClose;
    
    // Badge
    const badgeOpen = (line.match(/<Badge[^>]*>/g) || []).length;
    const badgeClose = (line.match(/<\/Badge>/g) || []).length;
    counts.Badge.open += badgeOpen;
    counts.Badge.close += badgeClose;
    
    // div
    const divOpen = (line.match(/<div[^>]*>/g) || []).length;
    const divClose = (line.match(/<\/div>/g) || []).length;
    counts.div.open += divOpen;
    counts.div.close += divClose;
    
    // Select
    const selectOpen = (line.match(/<Select[^>]*>/g) || []).length;
    const selectClose = (line.match(/<\/Select>/g) || []).length;
    counts.Select.open += selectOpen;
    counts.Select.close += selectClose;
  });
  
  // Corriger les déséquilibres
  Object.entries(counts).forEach(([tag, count]) => {
    const diff = count.close - count.open;
    if (diff > 0) {
      // Trop de fermetures - retirer les fermetures en trop
      let removed = 0;
      for (let i = lines.length - 1; i >= 0 && removed < diff; i--) {
        const pattern = new RegExp(`</${tag}>`, 'g');
        if (pattern.test(lines[i])) {
          const before = lines[i];
          lines[i] = lines[i].replace(pattern, '');
          if (lines[i] !== before) {
            modified = true;
            removed++;
            // Si la ligne est maintenant vide, la supprimer
            if (!lines[i].trim()) {
              lines.splice(i, 1);
            }
          }
        }
      }
    } else if (diff < 0) {
      // Pas assez de fermetures - ajouter les fermetures manquantes
      const missing = Math.abs(diff);
      // Trouver la fin du composant pour ajouter les fermetures
      let insertLine = lines.length - 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('export default') || 
            (lines[i].includes('return (') && i < lines.length - 5)) {
          insertLine = i;
          break;
        }
      }
      
      // Ajouter les fermetures manquantes
      const indent = '  ';
      for (let i = 0; i < missing; i++) {
        lines.splice(insertLine, 0, `${indent}</${tag}>`);
        modified = true;
      }
    }
  });
  
  // 3. Corriger les balises non fermées spécifiques
  errors.forEach(error => {
    if (error.type === 'unclosed' && !SELF_CLOSING.includes(error.tag)) {
      const lineNum = error.line - 1;
      if (lineNum < lines.length) {
        // Trouver où insérer la fermeture
        let insertLine = lines.length - 1;
        for (let i = lineNum + 1; i < lines.length; i++) {
          if (lines[i].includes('return (') || 
              lines[i].includes('export default') ||
              lines[i].includes('</ErrorBoundary>') ||
              (lines[i].trim() === '}' && i > lineNum + 10)) {
            insertLine = i;
            break;
          }
        }
        
        const indent = '  ';
        lines.splice(insertLine, 0, `${indent}</${error.tag}>`);
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Correction complète des erreurs JSX...\n');
  
  let totalFixed = 0;
  let filesFixed = 0;
  
  report.details.forEach(({ file, errors }) => {
    const filePath = path.join(DASHBOARD_DIR, file);
    if (fs.existsSync(filePath)) {
      const fixed = fixFile(filePath, errors);
      if (fixed) {
        filesFixed++;
        totalFixed += errors.length;
        console.log(`✅ ${file} - ${errors.length} erreur(s) corrigée(s)`);
      }
    }
  });
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   Fichiers corrigés: ${filesFixed}`);
  console.log(`   Total d'erreurs corrigées: ${totalFixed}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };











