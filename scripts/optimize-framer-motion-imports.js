#!/usr/bin/env node

/**
 * Script pour optimiser les imports de framer-motion
 * Remplace les imports statiques par des imports dynamiques
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

// Patterns de remplacement
const replacements = [
  {
    // Import simple: import { motion } from 'framer-motion';
    pattern: /import\s+{\s*motion\s*}\s+from\s+['"]framer-motion['"];?/g,
    replacement: `import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';`,
  },
  {
    // Import avec AnimatePresence: import { motion, AnimatePresence } from 'framer-motion';
    pattern: /import\s+{\s*motion\s*,\s*AnimatePresence\s*}\s+from\s+['"]framer-motion['"];?/g,
    replacement: `import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';`,
  },
  {
    // Import AnimatePresence seul: import { AnimatePresence } from 'framer-motion';
    pattern: /import\s+{\s*AnimatePresence\s*}\s+from\s+['"]framer-motion['"];?/g,
    replacement: `import { LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';`,
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Optimisé: ${path.relative(FRONTEND_SRC, filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log('🚀 Optimisation des imports framer-motion...\n');

  const files = findFiles(FRONTEND_SRC);
  let optimizedCount = 0;

  files.forEach((file) => {
    if (processFile(file)) {
      optimizedCount++;
    }
  });

  console.log(`\n✨ Optimisation terminée: ${optimizedCount} fichier(s) modifié(s)`);
  
  if (optimizedCount > 0) {
    console.log('\n📝 Note: Vérifiez que les composants fonctionnent correctement après cette optimisation.');
    console.log('   Les composants motion sont maintenant chargés de manière lazy.');
  }
}

main();

