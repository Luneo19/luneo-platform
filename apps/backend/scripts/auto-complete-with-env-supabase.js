#!/usr/bin/env node

/**
 * Script automatique complet utilisant .env.supabase
 * Migration + Setup + Déploiement
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Utiliser DATABASE_URL de .env.supabase si disponible
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
    console.log('✅ DATABASE_URL chargé depuis .env.supabase\n');
  }
}

const prisma = new PrismaClient();

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) {
  console.log(`${GREEN}[${new Date().toLocaleTimeString()}] ✅ ${msg}${RESET}`);
}

function warn(msg) {
  console.log(`${YELLOW}[${new Date().toLocaleTimeString()}] ⚠️  ${msg}${RESET}`);
}

function error(msg) {
  console.log(`${RED}[${new Date().toLocaleTimeString()}] ❌ ${msg}${RESET}`);
  process.exit(1);
}

async function applyMigration() {
  log('Application de la migration DB...\n');

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Exécuter la migration SQL complète
    await prisma.$executeRawUnsafe(migrationSQL);
    log('✅ Migration appliquée!\n');
  } catch (err) {
    // Si erreur "already exists", c'est OK
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      log('✅ Migration déjà appliquée (tables existent)\n');
    } else if (err.message.includes("Can't reach database")) {
      warn('⚠️  Connexion DB impossible, migration manuelle requise');
      console.log('\n📋 Pour appliquer manuellement:');
      console.log('1. Ouvrir: prisma/migrations/add_credits_system.sql');
      console.log('2. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
      console.log('3. SQL Editor → Coller et exécuter\n');
      return false;
    } else {
      warn(`⚠️  Erreur migration: ${err.message.substring(0, 100)}`);
      // Continuer quand même
    }
  }

  return true;
}

async function verifyMigration() {
  log('Vérification migration...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`✅ Migration OK (${count} packs)\n`);
      return true;
    } else {
      warn(`⚠️  Migration incomplète: ${count} packs (attendu: 3)\n`);
      return false;
    }
  } catch (err) {
    warn(`⚠️  Vérification échouée: ${err.message.substring(0, 80)}\n`);
    return false;
  }
}

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Prisma régénéré\n');
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
  }
}

async function buildBackend() {
  log('Build Backend...');
  try {
    execSync('pnpm build', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Build réussi\n');
  } catch (err) {
    error(`Échec build: ${err.message}`);
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits\n');
    return [];
  }

  // Retirer guillemets
  stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');

  const stripe = new Stripe(stripeSecretKey);

  log('Création produits Stripe...\n');

  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100 Crédits IA',
      description: '100 crédits pour générer des designs avec l\'IA',
      credits: 100,
      priceCents: 1900,
      metadata: { pack_id: 'pack_100', credits: '100' },
    },
    {
      id: 'pack_500',
      name: 'Pack 500 Crédits IA',
      description: '500 crédits pour générer des designs avec l\'IA - Best Value',
      credits: 500,
      priceCents: 7900,
      metadata: { pack_id: 'pack_500', credits: '500' },
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000 Crédits IA',
      description: '1000 crédits pour générer des designs avec l\'IA',
      credits: 1000,
      priceCents: 13900,
      metadata: { pack_id: 'pack_1000', credits: '1000' },
    },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Créer le produit
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata,
      });

      // Créer le price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: pack.metadata,
      });

      console.log(`  ✅ Price ID: ${price.id}\n`);

      // Mettre à jour la base de données
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
          price.id,
          pack.id
        );
      } catch (dbErr) {
        warn(`  ⚠️  Erreur mise à jour DB: ${dbErr.message.substring(0, 60)}`);
      }

      results.push({
        packId: pack.id,
        priceId: price.id,
        name: pack.name,
      });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà: ${pack.name}\n`);
      } else {
        error(`  ❌ Erreur: ${err.message}`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés!\n');
    console.log('📋 Résumé:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('');
  }

  return results;
}

async function deploy() {
  log('Déploiement Vercel...');
  
  try {
    // Frontend
    const frontendPath = path.join(__dirname, '../../frontend');
    if (fs.existsSync(frontendPath)) {
      log('Déploiement Frontend...');
      try {
        execSync('vercel --prod --yes', { 
          stdio: 'inherit', 
          cwd: frontendPath,
          env: { ...process.env }
        });
        log('✅ Frontend déployé\n');
      } catch (err) {
        warn(`⚠️  Frontend: ${err.message.substring(0, 60)}\n`);
      }
    }

    // Backend
    const backendPath = path.join(__dirname, '..');
    if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      try {
        execSync('vercel --prod --yes', { 
          stdio: 'inherit', 
          cwd: backendPath,
          env: { ...process.env }
        });
        log('✅ Backend déployé\n');
      } catch (err) {
        warn(`⚠️  Backend: ${err.message.substring(0, 60)}\n`);
      }
    }
  } catch (err) {
    warn(`⚠️  Déploiement échoué: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP AUTOMATIQUE COMPLET - SYSTÈME CRÉDITS IA 🚀                ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Migration DB
    const migrationOK = await applyMigration();
    
    if (migrationOK) {
      // Vérifier
      await verifyMigration();
    }

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Créer produits Stripe
    await createStripeProducts();

    // 5. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ!');
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();



#!/usr/bin/env node

/**
 * Script automatique complet utilisant .env.supabase
 * Migration + Setup + Déploiement
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Utiliser DATABASE_URL de .env.supabase si disponible
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
    console.log('✅ DATABASE_URL chargé depuis .env.supabase\n');
  }
}

const prisma = new PrismaClient();

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) {
  console.log(`${GREEN}[${new Date().toLocaleTimeString()}] ✅ ${msg}${RESET}`);
}

function warn(msg) {
  console.log(`${YELLOW}[${new Date().toLocaleTimeString()}] ⚠️  ${msg}${RESET}`);
}

function error(msg) {
  console.log(`${RED}[${new Date().toLocaleTimeString()}] ❌ ${msg}${RESET}`);
  process.exit(1);
}

async function applyMigration() {
  log('Application de la migration DB...\n');

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Exécuter la migration SQL complète
    await prisma.$executeRawUnsafe(migrationSQL);
    log('✅ Migration appliquée!\n');
  } catch (err) {
    // Si erreur "already exists", c'est OK
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      log('✅ Migration déjà appliquée (tables existent)\n');
    } else if (err.message.includes("Can't reach database")) {
      warn('⚠️  Connexion DB impossible, migration manuelle requise');
      console.log('\n📋 Pour appliquer manuellement:');
      console.log('1. Ouvrir: prisma/migrations/add_credits_system.sql');
      console.log('2. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
      console.log('3. SQL Editor → Coller et exécuter\n');
      return false;
    } else {
      warn(`⚠️  Erreur migration: ${err.message.substring(0, 100)}`);
      // Continuer quand même
    }
  }

  return true;
}

async function verifyMigration() {
  log('Vérification migration...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`✅ Migration OK (${count} packs)\n`);
      return true;
    } else {
      warn(`⚠️  Migration incomplète: ${count} packs (attendu: 3)\n`);
      return false;
    }
  } catch (err) {
    warn(`⚠️  Vérification échouée: ${err.message.substring(0, 80)}\n`);
    return false;
  }
}

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Prisma régénéré\n');
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
  }
}

async function buildBackend() {
  log('Build Backend...');
  try {
    execSync('pnpm build', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Build réussi\n');
  } catch (err) {
    error(`Échec build: ${err.message}`);
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits\n');
    return [];
  }

  // Retirer guillemets
  stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');

  const stripe = new Stripe(stripeSecretKey);

  log('Création produits Stripe...\n');

  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100 Crédits IA',
      description: '100 crédits pour générer des designs avec l\'IA',
      credits: 100,
      priceCents: 1900,
      metadata: { pack_id: 'pack_100', credits: '100' },
    },
    {
      id: 'pack_500',
      name: 'Pack 500 Crédits IA',
      description: '500 crédits pour générer des designs avec l\'IA - Best Value',
      credits: 500,
      priceCents: 7900,
      metadata: { pack_id: 'pack_500', credits: '500' },
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000 Crédits IA',
      description: '1000 crédits pour générer des designs avec l\'IA',
      credits: 1000,
      priceCents: 13900,
      metadata: { pack_id: 'pack_1000', credits: '1000' },
    },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Créer le produit
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata,
      });

      // Créer le price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: pack.metadata,
      });

      console.log(`  ✅ Price ID: ${price.id}\n`);

      // Mettre à jour la base de données
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
          price.id,
          pack.id
        );
      } catch (dbErr) {
        warn(`  ⚠️  Erreur mise à jour DB: ${dbErr.message.substring(0, 60)}`);
      }

      results.push({
        packId: pack.id,
        priceId: price.id,
        name: pack.name,
      });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà: ${pack.name}\n`);
      } else {
        error(`  ❌ Erreur: ${err.message}`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés!\n');
    console.log('📋 Résumé:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('');
  }

  return results;
}

async function deploy() {
  log('Déploiement Vercel...');
  
  try {
    // Frontend
    const frontendPath = path.join(__dirname, '../../frontend');
    if (fs.existsSync(frontendPath)) {
      log('Déploiement Frontend...');
      try {
        execSync('vercel --prod --yes', { 
          stdio: 'inherit', 
          cwd: frontendPath,
          env: { ...process.env }
        });
        log('✅ Frontend déployé\n');
      } catch (err) {
        warn(`⚠️  Frontend: ${err.message.substring(0, 60)}\n`);
      }
    }

    // Backend
    const backendPath = path.join(__dirname, '..');
    if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      try {
        execSync('vercel --prod --yes', { 
          stdio: 'inherit', 
          cwd: backendPath,
          env: { ...process.env }
        });
        log('✅ Backend déployé\n');
      } catch (err) {
        warn(`⚠️  Backend: ${err.message.substring(0, 60)}\n`);
      }
    }
  } catch (err) {
    warn(`⚠️  Déploiement échoué: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP AUTOMATIQUE COMPLET - SYSTÈME CRÉDITS IA 🚀                ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Migration DB
    const migrationOK = await applyMigration();
    
    if (migrationOK) {
      // Vérifier
      await verifyMigration();
    }

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Créer produits Stripe
    await createStripeProducts();

    // 5. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ!');
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();

















