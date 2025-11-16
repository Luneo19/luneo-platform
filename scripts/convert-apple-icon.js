#!/usr/bin/env node

/**
 * Script de conversion Apple Touch Icon SVG → PNG
 * 
 * Usage: node scripts/convert-apple-icon.js
 * 
 * Prérequis: sharp-cli installé globalement
 *   npm install -g sharp-cli
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../apps/frontend/public/apple-touch-icon.png');
const outputPath = path.join(__dirname, '../apps/frontend/public/apple-touch-icon.png');

console.log('🎨 Conversion Apple Touch Icon SVG → PNG');
console.log('========================================\n');

// Vérifier si le fichier existe
if (!fs.existsSync(inputPath)) {
  console.error('❌ Fichier source non trouvé:', inputPath);
  process.exit(1);
}

// Vérifier si sharp-cli est installé
try {
  execSync('which sharp-cli', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ sharp-cli n\'est pas installé.');
  console.log('\n📦 Installation:');
  console.log('   npm install -g sharp-cli');
  console.log('\n💡 Alternatives:');
  console.log('   - Utiliser CloudConvert: https://cloudconvert.com/svg-to-png');
  console.log('   - Utiliser ImageMagick: brew install imagemagick');
  process.exit(1);
}

console.log('📥 Fichier source:', inputPath);
console.log('📤 Fichier cible:', outputPath);
console.log('📏 Taille: 180x180px\n');

try {
  // Convertir avec sharp-cli
  execSync(
    `sharp-cli -i "${inputPath}" -o "${outputPath}" --resize 180x180 --format png`,
    { stdio: 'inherit' }
  );
  
  console.log('\n✅ Conversion réussie!');
  console.log('\n📱 Prochaines étapes:');
  console.log('   1. Vérifier le fichier généré');
  console.log('   2. Tester sur un appareil iOS');
  console.log('   3. Déployer l\'application');
  
} catch (error) {
  console.error('\n❌ Erreur lors de la conversion:', error.message);
  console.log('\n💡 Essayez une méthode alternative:');
  console.log('   - CloudConvert: https://cloudconvert.com/svg-to-png');
  console.log('   - ImageMagick: convert apple-touch-icon.png -resize 180x180 apple-touch-icon.png');
  process.exit(1);
}

