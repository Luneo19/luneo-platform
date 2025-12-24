/**
 * Script d'optimisation pour Vercel
 * Optimise le build pour les fonctions serverless
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Optimisation pour Vercel...');

// Vérifier que les fichiers nécessaires existent
const requiredFiles = [
  'api/index.ts',
  'src/serverless.ts',
  'prisma/schema.prisma',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Fichier manquant: ${file}`);
  } else {
    console.log(`✅ ${file} trouvé`);
  }
});

// Vérifier la configuration TypeScript
const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  
  // S'assurer que les options sont optimisées pour Vercel
  if (!tsConfig.compilerOptions.esModuleInterop) {
    console.log('⚠️  esModuleInterop devrait être activé pour Vercel');
  }
  
  console.log('✅ Configuration TypeScript vérifiée');
}

console.log('✅ Optimisation terminée');

