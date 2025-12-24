#!/usr/bin/env node

/**
 * Script pour analyser le bundle size et identifier les opportunités d'optimisation
 * Usage: node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '../apps/frontend');

// Packages lourds connus (en KB)
const HEAVY_PACKAGES = {
  'three': 500,
  '@react-three/fiber': 200,
  '@react-three/drei': 150,
  'framer-motion': 100,
  'konva': 150,
  'react-konva': 50,
  '@nivo/bar': 80,
  '@nivo/line': 80,
  '@nivo/pie': 80,
  'recharts': 120,
  'html2canvas': 80,
  'jspdf': 60,
  'jszip': 40,
  '@tensorflow/tfjs-core': 300,
  '@tensorflow/tfjs-backend-webgl': 200,
  '@mediapipe/face_mesh': 150,
  '@mediapipe/hands': 150,
  'socket.io-client': 50,
  'stripe': 80,
  'openai': 60,
};

// Composants qui devraient être en dynamic import
const SHOULD_BE_LAZY = [
  'ThreeViewer',
  'ProductConfigurator3D',
  'ARViewer',
  'CanvasEditor',
  'ProductCustomizer',
  'TemplateGallery',
  'ClipartBrowser',
  'AIStudio',
  'AnalyticsDashboard',
  'ChartContainer',
  'ImageEditor',
  'CodeEditor',
  'RichTextEditor',
  'DatePicker',
  'ColorPicker',
];

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
    const stats = {
      file: path.relative(process.cwd(), filePath),
      heavyImports: [],
      shouldBeLazy: [],
      staticImports: [],
      dynamicImports: 0,
      totalImports: 0,
    };
    
    // Détecter imports de packages lourds
    for (const [pkg, size] of Object.entries(HEAVY_PACKAGES)) {
      const importPattern = new RegExp(`import.*from\\s+['"]${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      if (importPattern.test(content)) {
        stats.heavyImports.push({ package: pkg, size });
      }
    }
    
    // Détecter composants qui devraient être lazy
    for (const component of SHOULD_BE_LAZY) {
      const importPattern = new RegExp(`import.*${component}.*from`, 'g');
      if (importPattern.test(content) && !content.includes('dynamic') && !content.includes('Lazy')) {
        stats.shouldBeLazy.push(component);
      }
    }
    
    // Compter imports statiques vs dynamiques
    const staticImportMatches = content.matchAll(/^import\s+.*from\s+['"]/gm);
    stats.staticImports = Array.from(staticImportMatches).length;
    
    const dynamicImportMatches = content.matchAll(/dynamic\s*\(|import\s*\(/g);
    stats.dynamicImports = Array.from(dynamicImportMatches).length;
    
    stats.totalImports = stats.staticImports + stats.dynamicImports;
    
    // Calculer score d'optimisation
    let optimizationScore = 0;
    if (stats.heavyImports.length > 0) optimizationScore += stats.heavyImports.length * 3;
    if (stats.shouldBeLazy.length > 0) optimizationScore += stats.shouldBeLazy.length * 5;
    if (stats.staticImports > 20) optimizationScore += 2;
    if (stats.dynamicImports === 0 && stats.heavyImports.length > 0) optimizationScore += 5;
    
    stats.optimizationScore = optimizationScore;
    
    return stats;
  } catch (error) {
    return { file: filePath, error: error.message };
  }
}

function main() {
  console.log('🔍 Analyse du bundle size...\n');
  
  const srcDir = path.join(FRONTEND_DIR, 'src');
  const files = findFiles(srcDir);
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const results = [];
  let totalHeavyImports = 0;
  let totalShouldBeLazy = 0;
  
  for (const file of files) {
    const stats = analyzeFile(file);
    if (stats && !stats.error && stats.optimizationScore > 0) {
      results.push(stats);
      totalHeavyImports += stats.heavyImports.length;
      totalShouldBeLazy += stats.shouldBeLazy.length;
    }
  }
  
  // Trier par score d'optimisation
  results.sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0));
  
  console.log('📊 Statistiques Globales:');
  console.log(`  Packages lourds détectés: ${totalHeavyImports}`);
  console.log(`  Composants à lazy load: ${totalShouldBeLazy}`);
  console.log('');
  
  // Top 20 fichiers à optimiser
  const topOptimizations = results.slice(0, 20);
  
  if (topOptimizations.length > 0) {
    console.log('🎯 Top 20 fichiers à optimiser:\n');
    topOptimizations.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (Score: ${result.optimizationScore})`);
      if (result.heavyImports.length > 0) {
        console.log(`   📦 Packages lourds: ${result.heavyImports.map(i => `${i.package} (${i.size}KB)`).join(', ')}`);
      }
      if (result.shouldBeLazy.length > 0) {
        console.log(`   ⚡ À lazy load: ${result.shouldBeLazy.join(', ')}`);
      }
      console.log(`   📊 Imports: ${result.staticImports} statiques, ${result.dynamicImports} dynamiques`);
      console.log('');
    });
  }
  
  // Générer rapport
  const report = {
    summary: {
      totalFiles: files.length,
      filesNeedingOptimization: topOptimizations.length,
      totalHeavyImports,
      totalShouldBeLazy,
    },
    topOptimizations: topOptimizations.map(r => ({
      file: r.file,
      score: r.optimizationScore,
      heavyImports: r.heavyImports,
      shouldBeLazy: r.shouldBeLazy,
      staticImports: r.staticImports,
      dynamicImports: r.dynamicImports,
    })),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../bundle-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('✅ Rapport généré: bundle-analysis.json');
  console.log('\n💡 Recommandations:');
  console.log('  1. Utiliser dynamic imports pour composants lourds');
  console.log('  2. Lazy load les composants 3D/AR');
  console.log('  3. Code split par route');
  console.log('  4. Optimiser les imports de packages lourds');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findFiles };

