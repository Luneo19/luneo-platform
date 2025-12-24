#!/usr/bin/env node

/**
 * Script pour analyser les hooks React et identifier les optimisations nécessaires
 * Usage: node scripts/analyze-react-hooks.js
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

// Patterns à analyser
const PATTERNS = {
  useState: /useState\(/g,
  useEffect: /useEffect\(/g,
  useMemo: /useMemo\(/g,
  useCallback: /useCallback\(/g,
  ReactMemo: /React\.memo\(|memo\(/g,
  component: /^(export\s+)?(default\s+)?function\s+\w+|^const\s+\w+\s*=\s*(\([^)]*\)\s*=>|function)/gm,
};

function findFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (fullPath.includes('node_modules') || fullPath.includes('.next')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ignorer les fichiers de test
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return null;
    }
    
    const stats = {
      file: path.relative(process.cwd(), filePath),
      useState: (content.match(PATTERNS.useState) || []).length,
      useEffect: (content.match(PATTERNS.useEffect) || []).length,
      useMemo: (content.match(PATTERNS.useMemo) || []).length,
      useCallback: (content.match(PATTERNS.useCallback) || []).length,
      ReactMemo: (content.match(PATTERNS.ReactMemo) || []).length,
      hasProps: /props|interface.*Props|type.*Props/.test(content),
      hasMap: /\.map\(/.test(content),
      hasFilter: /\.filter\(/.test(content),
      hasComplexCalc: /Math\.|reduce\(|sort\(/.test(content),
    };
    
    // Calculer score d'optimisation nécessaire
    let optimizationScore = 0;
    const recommendations = [];
    
    if (stats.hasProps && stats.ReactMemo === 0) {
      optimizationScore += 3;
      recommendations.push('Ajouter React.memo (composant avec props)');
    }
    
    if (stats.hasMap && stats.useMemo === 0) {
      optimizationScore += 2;
      recommendations.push('Utiliser useMemo pour .map()');
    }
    
    if (stats.hasFilter && stats.useMemo === 0) {
      optimizationScore += 2;
      recommendations.push('Utiliser useMemo pour .filter()');
    }
    
    if (stats.hasComplexCalc && stats.useMemo === 0) {
      optimizationScore += 2;
      recommendations.push('Utiliser useMemo pour calculs complexes');
    }
    
    if (stats.useEffect > 3) {
      optimizationScore += 1;
      recommendations.push('Trop de useEffect, considérer useReducer');
    }
    
    if (stats.useState > 5) {
      optimizationScore += 1;
      recommendations.push('Trop de useState, considérer useReducer');
    }
    
    stats.optimizationScore = optimizationScore;
    stats.recommendations = recommendations;
    
    return stats;
  } catch (error) {
    return { file: filePath, error: error.message };
  }
}

function main() {
  console.log('🔍 Analyse des hooks React...\n');
  
  const files = findFiles(FRONTEND_SRC);
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const results = [];
  let totalUseState = 0;
  let totalUseEffect = 0;
  let totalUseMemo = 0;
  let totalUseCallback = 0;
  let totalReactMemo = 0;
  
  for (const file of files) {
    const stats = analyzeFile(file);
    if (stats && !stats.error) {
      results.push(stats);
      totalUseState += stats.useState;
      totalUseEffect += stats.useEffect;
      totalUseMemo += stats.useMemo;
      totalUseCallback += stats.useCallback;
      totalReactMemo += stats.ReactMemo;
    }
  }
  
  // Trier par score d'optimisation
  results.sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0));
  
  console.log('📊 Statistiques Globales:');
  console.log(`  useState: ${totalUseState}`);
  console.log(`  useEffect: ${totalUseEffect}`);
  console.log(`  useMemo: ${totalUseMemo}`);
  console.log(`  useCallback: ${totalUseCallback}`);
  console.log(`  React.memo: ${totalReactMemo}`);
  console.log('');
  
  // Top 20 fichiers à optimiser
  const topOptimizations = results
    .filter(r => r.optimizationScore > 0)
    .slice(0, 20);
  
  if (topOptimizations.length > 0) {
    console.log('🎯 Top 20 fichiers à optimiser:\n');
    topOptimizations.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (Score: ${result.optimizationScore})`);
      result.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log('');
    });
  }
  
  // Générer rapport
  const report = {
    summary: {
      totalFiles: results.length,
      totalUseState,
      totalUseEffect,
      totalUseMemo,
      totalUseCallback,
      totalReactMemo,
      filesNeedingOptimization: topOptimizations.length,
    },
    topOptimizations: topOptimizations.map(r => ({
      file: r.file,
      score: r.optimizationScore,
      recommendations: r.recommendations,
    })),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../react-hooks-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('✅ Rapport généré: react-hooks-analysis.json');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findFiles };

