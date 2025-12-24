#!/usr/bin/env node

/**
 * Script de vérification - AWS doit être désactivé
 * 
 * Ce script vérifie qu'aucune variable d'environnement AWS n'est configurée
 * et qu'aucune ressource AWS n'est utilisée dans le code.
 */

const fs = require('fs');
const path = require('path');

const AWS_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'AWS_DEFAULT_REGION',
];

const AWS_PACKAGES = [
  'aws-sdk',
  '@aws-sdk/client-s3',
  '@aws-sdk/client-ec2',
  '@aws-sdk/client-rds',
  '@aws-sdk/client-elasticache',
];

let errors = [];
let warnings = [];

console.log('🔍 Vérification de la désactivation AWS...\n');

// 1. Vérifier les variables d'environnement
console.log('1️⃣ Vérification des variables d\'environnement...');
const envFiles = [
  '.env',
  '.env.local',
  '.env.production',
  'apps/frontend/.env.local',
  'apps/backend/.env.local',
];

envFiles.forEach(envFile => {
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    AWS_ENV_VARS.forEach(varName => {
      if (content.includes(varName)) {
        errors.push(`❌ Variable AWS trouvée dans ${envFile}: ${varName}`);
      }
    });
  }
});

// Vérifier aussi process.env
AWS_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    errors.push(`❌ Variable AWS définie dans l'environnement: ${varName}`);
  }
});

if (errors.length === 0) {
  console.log('   ✅ Aucune variable AWS détectée\n');
} else {
  console.log('   ⚠️ Variables AWS détectées:\n');
  errors.forEach(err => console.log(`   ${err}`));
  console.log('');
}

// 2. Vérifier les packages AWS dans package.json
console.log('2️⃣ Vérification des dépendances AWS...');
const packageFiles = [
  'package.json',
  'apps/frontend/package.json',
  'apps/backend/package.json',
];

packageFiles.forEach(pkgFile => {
  const fullPath = path.join(process.cwd(), pkgFile);
  if (fs.existsSync(fullPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      
      AWS_PACKAGES.forEach(pkgName => {
        if (allDeps[pkgName]) {
          warnings.push(`⚠️ Package AWS trouvé dans ${pkgFile}: ${pkgName}`);
        }
      });
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
});

if (warnings.length === 0) {
  console.log('   ✅ Aucun package AWS détecté\n');
} else {
  console.log('   ⚠️ Packages AWS détectés:\n');
  warnings.forEach(warn => console.log(`   ${warn}`));
  console.log('');
}

// 3. Vérifier Terraform
console.log('3️⃣ Vérification de Terraform...');
const terraformPath = path.join(process.cwd(), 'infrastructure/terraform');
if (fs.existsSync(terraformPath)) {
  const mainTf = path.join(terraformPath, 'main.tf');
  if (fs.existsSync(mainTf)) {
    const content = fs.readFileSync(mainTf, 'utf8');
    if (content.includes('provider "aws"')) {
      warnings.push('⚠️ Configuration Terraform AWS trouvée dans infrastructure/terraform/main.tf');
      console.log('   ⚠️ Configuration Terraform AWS détectée');
      console.log('   💡 Exécutez "terraform destroy" pour supprimer les ressources\n');
    }
  }
} else {
  console.log('   ✅ Aucun répertoire Terraform trouvé\n');
}

// Résumé
console.log('📊 Résumé:\n');
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ AWS est correctement désactivé !\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERREURS CRITIQUES:');
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }
  if (warnings.length > 0) {
    console.log('⚠️ AVERTISSEMENTS:');
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }
  console.log('💡 Consultez AWS_UTILISATION_ET_DESACTIVATION.md pour les instructions de désactivation.\n');
  process.exit(errors.length > 0 ? 1 : 0);
}

