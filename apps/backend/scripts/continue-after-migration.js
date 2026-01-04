#!/usr/bin/env node

/**
 * Script à exécuter APRÈS avoir appliqué la migration DB manuellement
 * Régénère Prisma, build, et déploie
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
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

async function checkMigration() {
  log('Vérification migration DB...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`✅ Migration OK (${count} packs trouvés)\n`);
      return true;
    } else {
      error(`Migration incomplète: ${count} packs trouvés (attendu: 3)`);
      return false;
    }
  } catch (err) {
    error(`Migration non appliquée: ${err.message.substring(0, 100)}`);
    console.log('\n📋 Pour appliquer la migration:');
    console.log('1. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
    console.log('2. SQL Editor → New query');
    console.log('3. Copier le contenu de: prisma/migrations/add_credits_system.sql');
    console.log('4. Coller et exécuter');
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

async function updateStripePrices() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut mise à jour prices\n');
    return;
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(stripeSecretKey);

  log('Vérification produits Stripe...\n');

  try {
    // Récupérer les packs depuis la DB
    const packs = await prisma.$queryRaw`
      SELECT id, name, credits, price_cents, stripe_price_id 
      FROM "CreditPack" 
      WHERE is_active = true
    `;

    for (const pack of packs) {
      if (pack.stripe_price_id) {
        console.log(`✅ ${pack.name}: ${pack.stripe_price_id}`);
      } else {
        warn(`⚠️  ${pack.name}: Pas de Stripe Price ID`);
        console.log(`   Créer manuellement ou exécuter: node scripts/create-stripe-products.js\n`);
      }
    }
  } catch (err) {
    warn(`Erreur vérification: ${err.message}\n`);
  }
}

async function deploy() {
  log('Déploiement Vercel...');
  
  if (!process.env.VERCEL_TOKEN) {
    warn('VERCEL_TOKEN non défini, déploiement manuel requis\n');
    return;
  }

  try {
    // Frontend
    const frontendPath = path.join(__dirname, '../../frontend');
    if (require('fs').existsSync(frontendPath)) {
      log('Déploiement Frontend...');
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: frontendPath,
        env: { ...process.env }
      });
    }

    // Backend
    const backendPath = path.join(__dirname, '..');
    if (require('fs').existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: backendPath,
        env: { ...process.env }
      });
    }

    log('✅ Déploiement terminé\n');
  } catch (err) {
    warn(`⚠️  Déploiement échoué (peut être fait manuellement): ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 CONTINUATION APRÈS MIGRATION DB 🚀                               ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Vérifier migration
    const migrationOK = await checkMigration();
    if (!migrationOK) {
      process.exit(1);
    }

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Vérifier Stripe Prices
    await updateStripePrices();

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
 * Script à exécuter APRÈS avoir appliqué la migration DB manuellement
 * Régénère Prisma, build, et déploie
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
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

async function checkMigration() {
  log('Vérification migration DB...');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CreditPack"
    `;
    
    const count = Number(result[0]?.count || 0);
    
    if (count >= 3) {
      log(`✅ Migration OK (${count} packs trouvés)\n`);
      return true;
    } else {
      error(`Migration incomplète: ${count} packs trouvés (attendu: 3)`);
      return false;
    }
  } catch (err) {
    error(`Migration non appliquée: ${err.message.substring(0, 100)}`);
    console.log('\n📋 Pour appliquer la migration:');
    console.log('1. Aller sur: https://obrijgptqztacolemsbk.supabase.co');
    console.log('2. SQL Editor → New query');
    console.log('3. Copier le contenu de: prisma/migrations/add_credits_system.sql');
    console.log('4. Coller et exécuter');
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

async function updateStripePrices() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut mise à jour prices\n');
    return;
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(stripeSecretKey);

  log('Vérification produits Stripe...\n');

  try {
    // Récupérer les packs depuis la DB
    const packs = await prisma.$queryRaw`
      SELECT id, name, credits, price_cents, stripe_price_id 
      FROM "CreditPack" 
      WHERE is_active = true
    `;

    for (const pack of packs) {
      if (pack.stripe_price_id) {
        console.log(`✅ ${pack.name}: ${pack.stripe_price_id}`);
      } else {
        warn(`⚠️  ${pack.name}: Pas de Stripe Price ID`);
        console.log(`   Créer manuellement ou exécuter: node scripts/create-stripe-products.js\n`);
      }
    }
  } catch (err) {
    warn(`Erreur vérification: ${err.message}\n`);
  }
}

async function deploy() {
  log('Déploiement Vercel...');
  
  if (!process.env.VERCEL_TOKEN) {
    warn('VERCEL_TOKEN non défini, déploiement manuel requis\n');
    return;
  }

  try {
    // Frontend
    const frontendPath = path.join(__dirname, '../../frontend');
    if (require('fs').existsSync(frontendPath)) {
      log('Déploiement Frontend...');
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: frontendPath,
        env: { ...process.env }
      });
    }

    // Backend
    const backendPath = path.join(__dirname, '..');
    if (require('fs').existsSync(path.join(backendPath, 'vercel.json'))) {
      log('Déploiement Backend...');
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: backendPath,
        env: { ...process.env }
      });
    }

    log('✅ Déploiement terminé\n');
  } catch (err) {
    warn(`⚠️  Déploiement échoué (peut être fait manuellement): ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 CONTINUATION APRÈS MIGRATION DB 🚀                               ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Vérifier migration
    const migrationOK = await checkMigration();
    if (!migrationOK) {
      process.exit(1);
    }

    // 2. Régénérer Prisma
    await regeneratePrisma();

    // 3. Build Backend
    await buildBackend();

    // 4. Vérifier Stripe Prices
    await updateStripePrices();

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

























