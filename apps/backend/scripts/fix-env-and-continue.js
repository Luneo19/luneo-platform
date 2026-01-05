#!/usr/bin/env node

/**
 * Script qui corrige les variables d'environnement et continue le setup
 */

const fs = require('fs');
const path = require('path');

function fixEnvFile() {
  const envPath = path.join(__dirname, '../.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.production non trouvé');
    return false;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  let modified = false;

  // Retirer les guillemets autour des valeurs
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      let value = valueParts.join('=');
      
      // Retirer guillemets
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
        modified = true;
        return `${key}=${value}`;
      }
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('✅ .env.production corrigé (guillemets retirés)');
    return true;
  }

  return false;
}

// Vérifier DATABASE_URL
function checkDatabaseURL() {
  require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL non trouvé');
    return false;
  }

  if (dbUrl.includes('[PASSWORD]')) {
    console.log('⚠️  DATABASE_URL contient [PASSWORD] placeholder');
    console.log('\n📋 Pour corriger:');
    console.log('1. Aller sur Supabase Dashboard');
    console.log('2. Settings → Database');
    console.log('3. Connection string → Copy');
    console.log('4. Remplacer [PASSWORD] dans .env.production');
    console.log('\nOu appliquez la migration manuellement (voir MIGRATION_SUPABASE_MANUELLE.md)');
    return false;
  }

  console.log('✅ DATABASE_URL valide');
  return true;
}

// Main
console.log('🔧 Correction variables d\'environnement...\n');

fixEnvFile();

console.log('\n🔍 Vérification credentials...\n');
const dbOK = checkDatabaseURL();

require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
  console.log(`✅ STRIPE_SECRET_KEY: ${stripeKey.substring(0, 20)}...`);
} else {
  console.log('❌ STRIPE_SECRET_KEY non trouvé');
}

console.log('\n📋 Prochaines étapes:');
if (!dbOK) {
  console.log('1. Corriger DATABASE_URL dans .env.production');
  console.log('2. Appliquer migration DB (voir MIGRATION_SUPABASE_MANUELLE.md)');
  console.log('3. Exécuter: node scripts/continue-after-migration.js');
} else {
  console.log('1. Appliquer migration DB');
  console.log('2. Exécuter: node scripts/continue-after-migration.js');
}



#!/usr/bin/env node

/**
 * Script qui corrige les variables d'environnement et continue le setup
 */

const fs = require('fs');
const path = require('path');

function fixEnvFile() {
  const envPath = path.join(__dirname, '../.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.production non trouvé');
    return false;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  let modified = false;

  // Retirer les guillemets autour des valeurs
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      let value = valueParts.join('=');
      
      // Retirer guillemets
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
        modified = true;
        return `${key}=${value}`;
      }
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('✅ .env.production corrigé (guillemets retirés)');
    return true;
  }

  return false;
}

// Vérifier DATABASE_URL
function checkDatabaseURL() {
  require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL non trouvé');
    return false;
  }

  if (dbUrl.includes('[PASSWORD]')) {
    console.log('⚠️  DATABASE_URL contient [PASSWORD] placeholder');
    console.log('\n📋 Pour corriger:');
    console.log('1. Aller sur Supabase Dashboard');
    console.log('2. Settings → Database');
    console.log('3. Connection string → Copy');
    console.log('4. Remplacer [PASSWORD] dans .env.production');
    console.log('\nOu appliquez la migration manuellement (voir MIGRATION_SUPABASE_MANUELLE.md)');
    return false;
  }

  console.log('✅ DATABASE_URL valide');
  return true;
}

// Main
console.log('🔧 Correction variables d\'environnement...\n');

fixEnvFile();

console.log('\n🔍 Vérification credentials...\n');
const dbOK = checkDatabaseURL();

require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
  console.log(`✅ STRIPE_SECRET_KEY: ${stripeKey.substring(0, 20)}...`);
} else {
  console.log('❌ STRIPE_SECRET_KEY non trouvé');
}

console.log('\n📋 Prochaines étapes:');
if (!dbOK) {
  console.log('1. Corriger DATABASE_URL dans .env.production');
  console.log('2. Appliquer migration DB (voir MIGRATION_SUPABASE_MANUELLE.md)');
  console.log('3. Exécuter: node scripts/continue-after-migration.js');
} else {
  console.log('1. Appliquer migration DB');
  console.log('2. Exécuter: node scripts/continue-after-migration.js');
}


























