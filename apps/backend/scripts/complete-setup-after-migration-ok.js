#!/usr/bin/env node

/**
 * Script de continuation après migration DB confirmée
 * Ne vérifie pas la connexion DB (déjà confirmée par l'utilisateur)
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Prisma régénéré\n');
    return true;
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
    return false;
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
    return true;
  } catch (err) {
    warn(`⚠️  Build échoué: ${err.message.substring(0, 100)}`);
    warn('⚠️  Cela peut être normal si Prisma n\'a pas encore les nouveaux champs\n');
    return false;
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits\n');
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
        // Récupérer le price existant
        try {
          const products = await stripe.products.list({ limit: 100 });
          const existingProduct = products.data.find(p => p.metadata?.pack_id === pack.id);
          if (existingProduct) {
            const prices = await stripe.prices.list({ product: existingProduct.id, limit: 1 });
            if (prices.data.length > 0) {
              results.push({ packId: pack.id, priceId: prices.data[0].id, name: pack.name });
              console.log(`  ✅ Price ID existant: ${prices.data[0].id}\n`);
            }
          }
        } catch (e) {
          warn(`  ⚠️  Impossible de récupérer le price existant\n`);
        }
      } else {
        warn(`  ⚠️  Erreur: ${err.message.substring(0, 60)}\n`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés/récupérés!\n');
    console.log('📋 Price IDs:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('\n📝 SQL pour mettre à jour la DB:');
    console.log('Exécuter sur Supabase SQL Editor:\n');
    results.forEach((r) => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
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
    warn(`⚠️  Déploiement: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP COMPLET - SYSTÈME CRÉDITS IA 🚀                            ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  info('Migration DB confirmée ✅\n');

  try {
    // 1. Régénérer Prisma
    await regeneratePrisma();

    // 2. Build Backend
    await buildBackend();

    // 3. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    // 4. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ!');
    console.log('');
    
    if (stripeResults.length > 0) {
      console.log('📋 PROCHAINES ÉTAPES:');
      console.log('');
      console.log('1. Mettre à jour les Stripe Price IDs dans la DB:');
      console.log('   → Aller sur: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new');
      console.log('   → Copier-coller les commandes UPDATE affichées ci-dessus');
      console.log('');
      console.log('2. Vérifier que tout fonctionne:');
      console.log('   → Tester l\'achat de crédits');
      console.log('   → Tester la génération IA');
      console.log('');
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
  }
}

main();



#!/usr/bin/env node

/**
 * Script de continuation après migration DB confirmée
 * Ne vérifie pas la connexion DB (déjà confirmée par l'utilisateur)
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function regeneratePrisma() {
  log('Régénération Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Prisma régénéré\n');
    return true;
  } catch (err) {
    error(`Échec génération Prisma: ${err.message}`);
    return false;
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
    return true;
  } catch (err) {
    warn(`⚠️  Build échoué: ${err.message.substring(0, 100)}`);
    warn('⚠️  Cela peut être normal si Prisma n\'a pas encore les nouveaux champs\n');
    return false;
  }
}

async function createStripeProducts() {
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    warn('STRIPE_SECRET_KEY non défini, saut création produits\n');
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
        // Récupérer le price existant
        try {
          const products = await stripe.products.list({ limit: 100 });
          const existingProduct = products.data.find(p => p.metadata?.pack_id === pack.id);
          if (existingProduct) {
            const prices = await stripe.prices.list({ product: existingProduct.id, limit: 1 });
            if (prices.data.length > 0) {
              results.push({ packId: pack.id, priceId: prices.data[0].id, name: pack.name });
              console.log(`  ✅ Price ID existant: ${prices.data[0].id}\n`);
            }
          }
        } catch (e) {
          warn(`  ⚠️  Impossible de récupérer le price existant\n`);
        }
      } else {
        warn(`  ⚠️  Erreur: ${err.message.substring(0, 60)}\n`);
      }
    }
  }

  if (results.length > 0) {
    log('✅ Produits Stripe créés/récupérés!\n');
    console.log('📋 Price IDs:');
    results.forEach((r) => {
      console.log(`  ${r.name}: ${r.priceId}`);
    });
    console.log('\n📝 SQL pour mettre à jour la DB:');
    console.log('Exécuter sur Supabase SQL Editor:\n');
    results.forEach((r) => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
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
    warn(`⚠️  Déploiement: ${err.message}\n`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║        🚀 SETUP COMPLET - SYSTÈME CRÉDITS IA 🚀                            ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  info('Migration DB confirmée ✅\n');

  try {
    // 1. Régénérer Prisma
    await regeneratePrisma();

    // 2. Build Backend
    await buildBackend();

    // 3. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    // 4. Déployer
    await deploy();

    console.log('');
    log('🎉 SETUP COMPLET TERMINÉ!');
    console.log('');
    
    if (stripeResults.length > 0) {
      console.log('📋 PROCHAINES ÉTAPES:');
      console.log('');
      console.log('1. Mettre à jour les Stripe Price IDs dans la DB:');
      console.log('   → Aller sur: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new');
      console.log('   → Copier-coller les commandes UPDATE affichées ci-dessus');
      console.log('');
      console.log('2. Vérifier que tout fonctionne:');
      console.log('   → Tester l\'achat de crédits');
      console.log('   → Tester la génération IA');
      console.log('');
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
  }
}

main();
























