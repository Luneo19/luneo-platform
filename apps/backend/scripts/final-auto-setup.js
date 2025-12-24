#!/usr/bin/env node

/**
 * Script final: Vérifie migration, puis continue automatiquement
 * Utilise toutes les sources de credentials disponibles
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

// Charger DATABASE_URL depuis .env.supabase si disponible
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
  }
}

const prisma = new PrismaClient();

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(msg) {
  console.log(`${GREEN}[${new Date().toLocaleTimeString()}] ✅ ${msg}${RESET}`);
}

function warn(msg) {
  console.log(`${YELLOW}[${new Date().toLocaleTimeString()}] ⚠️  ${msg}${RESET}`);
}

function info(msg) {
  console.log(`${BLUE}[${new Date().toLocaleTimeString()}] ℹ️  ${msg}${RESET}`);
}

function error(msg) {
  console.log(`${RED}[${new Date().toLocaleTimeString()}] ❌ ${msg}${RESET}`);
  process.exit(1);
}

async function checkMigration() {
  info('Vérification migration DB...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`Migration OK (${count} packs trouvés)\n`);
      return true;
    } else {
      warn(`Migration incomplète: ${count} packs (attendu: 3)\n`);
      return false;
    }
  } catch (err) {
    warn(`Migration non appliquée: ${err.message.substring(0, 100)}\n`);
    console.log('📋 INSTRUCTIONS MIGRATION MANUELLE (2 minutes):');
    console.log('');
    console.log('1. Ouvrir: apps/backend/prisma/migrations/add_credits_system.sql');
    console.log('2. Copier TOUT le contenu (Cmd+A, Cmd+C)');
    console.log('3. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
    console.log('4. SQL Editor → New query');
    console.log('5. Coller (Cmd+V)');
    console.log('6. Cliquer "Run" (Cmd+Enter)');
    console.log('7. Vérifier: SELECT COUNT(*) FROM "CreditPack"; (doit retourner 3)');
    console.log('');
    console.log('⚠️  Une fois la migration appliquée, réexécutez ce script.\n');
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
    warn(`⚠️  Erreur génération: ${err.message.substring(0, 60)}\n`);
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
    warn(`⚠️  Build échoué (normal si migration pas appliquée): ${err.message.substring(0, 60)}\n`);
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini\n');
    return [];
  }

  stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');

  if (!stripeSecretKey.startsWith('sk_')) {
    warn('STRIPE_SECRET_KEY invalide (ne commence pas par sk_)\n');
    return [];
  }

  const stripe = new Stripe(stripeSecretKey);

  log('Création produits Stripe...\n');

  const packs = [
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900 },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900 },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900 },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      const product = await stripe.products.create({
        name: pack.name,
        description: `${pack.credits} crédits pour générer des designs avec l'IA`,
        metadata: { pack_id: pack.id, credits: String(pack.credits) },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: { pack_id: pack.id, credits: String(pack.credits) },
      });

      console.log(`  ✅ Price ID: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà\n`);
      } else {
        warn(`  ⚠️  Erreur: ${err.message.substring(0, 60)}\n`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés!\n');
    console.log('📋 Price IDs:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('\n📝 Mettre à jour DB après migration:');
    results.forEach((r) => {
      console.log(`  UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
  }

  return results;
}

async function deploy() {
  log('Déploiement Vercel...');
  
  try {
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
  } catch (err) {
    warn(`⚠️  Déploiement: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP AUTOMATIQUE FINAL - SYSTÈME CRÉDITS IA 🚀                   ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Vérifier migration
    const migrationOK = await checkMigration();

    // 2. Régénérer Prisma (toujours, même si migration pas OK)
    await regeneratePrisma();

    // 3. Build Backend (peut échouer si migration pas OK, c'est normal)
    if (migrationOK) {
      await buildBackend();
    } else {
      warn('⚠️  Build backend ignoré (migration requise d\'abord)\n');
    }

    // 4. Créer produits Stripe (toujours, même si migration pas OK)
    await createStripeProducts();

    // 5. Déployer Frontend (toujours)
    await deploy();

    console.log('');
    if (migrationOK) {
      log('🎉 SETUP COMPLET TERMINÉ!');
    } else {
      warn('⚠️  SETUP PARTIEL - Migration DB requise');
      console.log('\n📋 Après avoir appliqué la migration:');
      console.log('   node scripts/continue-after-migration.js');
    }
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
 * Script final: Vérifie migration, puis continue automatiquement
 * Utilise toutes les sources de credentials disponibles
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

// Charger DATABASE_URL depuis .env.supabase si disponible
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
  }
}

const prisma = new PrismaClient();

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(msg) {
  console.log(`${GREEN}[${new Date().toLocaleTimeString()}] ✅ ${msg}${RESET}`);
}

function warn(msg) {
  console.log(`${YELLOW}[${new Date().toLocaleTimeString()}] ⚠️  ${msg}${RESET}`);
}

function info(msg) {
  console.log(`${BLUE}[${new Date().toLocaleTimeString()}] ℹ️  ${msg}${RESET}`);
}

function error(msg) {
  console.log(`${RED}[${new Date().toLocaleTimeString()}] ❌ ${msg}${RESET}`);
  process.exit(1);
}

async function checkMigration() {
  info('Vérification migration DB...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`Migration OK (${count} packs trouvés)\n`);
      return true;
    } else {
      warn(`Migration incomplète: ${count} packs (attendu: 3)\n`);
      return false;
    }
  } catch (err) {
    warn(`Migration non appliquée: ${err.message.substring(0, 100)}\n`);
    console.log('📋 INSTRUCTIONS MIGRATION MANUELLE (2 minutes):');
    console.log('');
    console.log('1. Ouvrir: apps/backend/prisma/migrations/add_credits_system.sql');
    console.log('2. Copier TOUT le contenu (Cmd+A, Cmd+C)');
    console.log('3. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
    console.log('4. SQL Editor → New query');
    console.log('5. Coller (Cmd+V)');
    console.log('6. Cliquer "Run" (Cmd+Enter)');
    console.log('7. Vérifier: SELECT COUNT(*) FROM "CreditPack"; (doit retourner 3)');
    console.log('');
    console.log('⚠️  Une fois la migration appliquée, réexécutez ce script.\n');
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
    warn(`⚠️  Erreur génération: ${err.message.substring(0, 60)}\n`);
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
    warn(`⚠️  Build échoué (normal si migration pas appliquée): ${err.message.substring(0, 60)}\n`);
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini\n');
    return [];
  }

  stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');

  if (!stripeSecretKey.startsWith('sk_')) {
    warn('STRIPE_SECRET_KEY invalide (ne commence pas par sk_)\n');
    return [];
  }

  const stripe = new Stripe(stripeSecretKey);

  log('Création produits Stripe...\n');

  const packs = [
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900 },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900 },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900 },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      const product = await stripe.products.create({
        name: pack.name,
        description: `${pack.credits} crédits pour générer des designs avec l'IA`,
        metadata: { pack_id: pack.id, credits: String(pack.credits) },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: { pack_id: pack.id, credits: String(pack.credits) },
      });

      console.log(`  ✅ Price ID: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        warn(`  ⚠️  Produit existe déjà\n`);
      } else {
        warn(`  ⚠️  Erreur: ${err.message.substring(0, 60)}\n`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés!\n');
    console.log('📋 Price IDs:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('\n📝 Mettre à jour DB après migration:');
    results.forEach((r) => {
      console.log(`  UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
  }

  return results;
}

async function deploy() {
  log('Déploiement Vercel...');
  
  try {
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
  } catch (err) {
    warn(`⚠️  Déploiement: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP AUTOMATIQUE FINAL - SYSTÈME CRÉDITS IA 🚀                   ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Vérifier migration
    const migrationOK = await checkMigration();

    // 2. Régénérer Prisma (toujours, même si migration pas OK)
    await regeneratePrisma();

    // 3. Build Backend (peut échouer si migration pas OK, c'est normal)
    if (migrationOK) {
      await buildBackend();
    } else {
      warn('⚠️  Build backend ignoré (migration requise d\'abord)\n');
    }

    // 4. Créer produits Stripe (toujours, même si migration pas OK)
    await createStripeProducts();

    // 5. Déployer Frontend (toujours)
    await deploy();

    console.log('');
    if (migrationOK) {
      log('🎉 SETUP COMPLET TERMINÉ!');
    } else {
      warn('⚠️  SETUP PARTIEL - Migration DB requise');
      console.log('\n📋 Après avoir appliqué la migration:');
      console.log('   node scripts/continue-after-migration.js');
    }
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
















