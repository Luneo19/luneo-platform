#!/usr/bin/env node

/**
 * Script pour analyser et optimiser les requêtes Prisma
 * Remplace include par select et ajoute pagination
 */

const fs = require('fs');
const path = require('path');

const BACKEND_SRC = path.join(__dirname, '../apps/backend/src');

// Patterns à rechercher
const INCLUDE_PATTERN = /include:\s*\{[^}]*\}/g;
const FIND_MANY_PATTERN = /\.findMany\(/g;
const FIND_FIRST_PATTERN = /\.findFirst\(/g;
const FIND_UNIQUE_PATTERN = /\.findUnique\(/g;

// Fichiers à ignorer
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /prisma-optimized\.service\.ts$/,
  /pagination\.helper\.ts$/,
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, extensions = ['.ts']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (shouldIgnore(fullPath)) {
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
    const stats = {
      file: path.relative(process.cwd(), filePath),
      includes: [],
      findMany: 0,
      findFirst: 0,
      findUnique: 0,
      needsPagination: false,
      needsSelect: false,
    };
    
    // Compter les includes
    const includeMatches = content.matchAll(INCLUDE_PATTERN);
    for (const match of includeMatches) {
      stats.includes.push(match[0]);
      stats.needsSelect = true;
    }
    
    // Compter les findMany (souvent besoin de pagination)
    const findManyMatches = content.matchAll(FIND_MANY_PATTERN);
    stats.findMany = Array.from(findManyMatches).length;
    
    // Vérifier si pagination manquante
    if (stats.findMany > 0 && !content.includes('skip') && !content.includes('take')) {
      stats.needsPagination = true;
    }
    
    const findFirstMatches = content.matchAll(FIND_FIRST_PATTERN);
    stats.findFirst = Array.from(findFirstMatches).length;
    
    const findUniqueMatches = content.matchAll(FIND_UNIQUE_PATTERN);
    stats.findUnique = Array.from(findUniqueMatches).length;
    
    // Calculer score d'optimisation
    let optimizationScore = 0;
    if (stats.includes.length > 0) optimizationScore += stats.includes.length * 3;
    if (stats.needsPagination) optimizationScore += stats.findMany * 5;
    if (stats.findMany > 0 && !content.includes('orderBy')) optimizationScore += 2;
    
    stats.optimizationScore = optimizationScore;
    
    return stats;
  } catch (error) {
    return { file: filePath, error: error.message };
  }
}

function main() {
  console.log('🔍 Analyse des requêtes Prisma...\n');
  
  const files = findFiles(BACKEND_SRC);
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const results = [];
  let totalIncludes = 0;
  let totalNeedsPagination = 0;
  let totalNeedsSelect = 0;
  
  for (const file of files) {
    const stats = analyzeFile(file);
    if (stats && !stats.error && stats.optimizationScore > 0) {
      results.push(stats);
      totalIncludes += stats.includes.length;
      if (stats.needsPagination) totalNeedsPagination++;
      if (stats.needsSelect) totalNeedsSelect++;
    }
  }
  
  // Trier par score d'optimisation
  results.sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0));
  
  console.log('📊 Statistiques Globales:');
  console.log(`  Includes trouvés: ${totalIncludes}`);
  console.log(`  Fichiers nécessitant pagination: ${totalNeedsPagination}`);
  console.log(`  Fichiers nécessitant select: ${totalNeedsSelect}`);
  console.log('');
  
  // Top 15 fichiers à optimiser
  const topOptimizations = results.slice(0, 15);
  
  if (topOptimizations.length > 0) {
    console.log('🎯 Top 15 fichiers à optimiser:\n');
    topOptimizations.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (Score: ${result.optimizationScore})`);
      if (result.includes.length > 0) {
        console.log(`   📦 Includes: ${result.includes.length} (à remplacer par select)`);
      }
      if (result.needsPagination) {
        console.log(`   📄 Pagination manquante: ${result.findMany} findMany sans skip/take`);
      }
      if (result.findMany > 0) {
        console.log(`   🔍 findMany: ${result.findMany}`);
      }
      console.log('');
    });
  }
  
  // Générer rapport
  const report = {
    summary: {
      totalFiles: files.length,
      filesNeedingOptimization: topOptimizations.length,
      totalIncludes,
      totalNeedsPagination,
      totalNeedsSelect,
    },
    topOptimizations: topOptimizations.map(r => ({
      file: r.file,
      score: r.optimizationScore,
      includes: r.includes.length,
      findMany: r.findMany,
      needsPagination: r.needsPagination,
      needsSelect: r.needsSelect,
    })),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../prisma-optimization-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('✅ Rapport généré: prisma-optimization-analysis.json');
  console.log('\n💡 Recommandations:');
  console.log('  1. Remplacer include par select pour ne charger que les champs nécessaires');
  console.log('  2. Ajouter pagination (skip/take) à tous les findMany');
  console.log('  3. Utiliser orderBy pour garantir un ordre cohérent');
  console.log('  4. Limiter les relations chargées');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findFiles };

