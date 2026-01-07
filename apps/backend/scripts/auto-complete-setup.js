#!/usr/bin/env node

/**
 * Script automatique complet: Migration + Setup + Déploiement
 * Charge automatiquement les credentials depuis .env.production
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' }); // Fallback

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

  // Exécuter via Prisma db execute
  try {
    // Diviser en blocs exécutables
    const blocks = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    for (const block of blocks) {
      if (block.includes('DO $$')) {
        // Bloc DO $$ - exécuter tel quel
        try {
          await prisma.$executeRawUnsafe(block);
          log('  ✅ Bloc exécuté');
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            warn(`  ⚠️  ${err.message.substring(0, 80)}`);
          }
        }
      } else if (block.startsWith('CREATE') || block.startsWith('ALTER') || block.startsWith('INSERT') || block.startsWith('UPDATE')) {
        try {
          await prisma.$executeRawUnsafe(block);
          log('  ✅ Statement exécuté');
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            warn(`  ⚠️  ${err.message.substring(0, 80)}`);
          }
        }
      }
    }

    log('\n✅ Migration appliquée!\n');
  } catch (err) {
    error(`Erreur migration: ${err.message}`);
  }
}

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log('✅ Prisma régénéré\n');
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
  }
}

async function buildBackend() {
  log('Build Backend...');
  try {
    execSync('pnpm build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log('✅ Build réussi\n');
  } catch (err) {
    error(`Échec build: ${err.message}`);
  }
}

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits Stripe\n');
    return [];
  }

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
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        price.id,
        pack.id
      );

      results.push({
        packId: pack.id,
        priceId: price.id,
        name: pack.name,
      });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà: ${pack.name}`);
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
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: frontendPath });
    }

    // Backend (si déployé sur Vercel)
    const backendPath = path.join(__dirname, '..');
    if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: backendPath });
    }

    log('✅ Déploiement terminé\n');
  } catch (err) {
    warn(`⚠️  Déploiement échoué (peut être fait manuellement): ${err.message}\n`);
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
    // Vérifier credentials
    if (!process.env.DATABASE_URL) {
      error('DATABASE_URL non défini dans .env.production');
    }
    log(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);

    if (process.env.STRIPE_SECRET_KEY) {
      log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
    } else {
      warn('STRIPE_SECRET_KEY non défini');
    }

    console.log('');

    // 1. Migration DB
    await applyMigration();

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Créer produits Stripe
    await createStripeProducts();

    // 5. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ AVEC SUCCÈS!');
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
 * Script automatique complet: Migration + Setup + Déploiement
 * Charge automatiquement les credentials depuis .env.production
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' }); // Fallback

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

  // Exécuter via Prisma db execute
  try {
    // Diviser en blocs exécutables
    const blocks = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    for (const block of blocks) {
      if (block.includes('DO $$')) {
        // Bloc DO $$ - exécuter tel quel
        try {
          await prisma.$executeRawUnsafe(block);
          log('  ✅ Bloc exécuté');
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            warn(`  ⚠️  ${err.message.substring(0, 80)}`);
          }
        }
      } else if (block.startsWith('CREATE') || block.startsWith('ALTER') || block.startsWith('INSERT') || block.startsWith('UPDATE')) {
        try {
          await prisma.$executeRawUnsafe(block);
          log('  ✅ Statement exécuté');
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            warn(`  ⚠️  ${err.message.substring(0, 80)}`);
          }
        }
      }
    }

    log('\n✅ Migration appliquée!\n');
  } catch (err) {
    error(`Erreur migration: ${err.message}`);
  }
}

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log('✅ Prisma régénéré\n');
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
  }
}

async function buildBackend() {
  log('Build Backend...');
  try {
    execSync('pnpm build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log('✅ Build réussi\n');
  } catch (err) {
    error(`Échec build: ${err.message}`);
  }
}

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits Stripe\n');
    return [];
  }

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
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        price.id,
        pack.id
      );

      results.push({
        packId: pack.id,
        priceId: price.id,
        name: pack.name,
      });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà: ${pack.name}`);
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
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: frontendPath });
    }

    // Backend (si déployé sur Vercel)
    const backendPath = path.join(__dirname, '..');
    if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: backendPath });
    }

    log('✅ Déploiement terminé\n');
  } catch (err) {
    warn(`⚠️  Déploiement échoué (peut être fait manuellement): ${err.message}\n`);
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
    // Vérifier credentials
    if (!process.env.DATABASE_URL) {
      error('DATABASE_URL non défini dans .env.production');
    }
    log(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);

    if (process.env.STRIPE_SECRET_KEY) {
      log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
    } else {
      warn('STRIPE_SECRET_KEY non défini');
    }

    console.log('');

    // 1. Migration DB
    await applyMigration();

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Créer produits Stripe
    await createStripeProducts();

    // 5. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ AVEC SUCCÈS!');
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();




























