#!/usr/bin/env node

/**
 * Script final: Créer produits Stripe + Update DB avec la vraie clé
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clé Stripe depuis variable d'environnement
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Charger DATABASE_URL
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
  }
}

const prisma = new PrismaClient();
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function error(msg) { console.log(`${RED}❌ ${msg}${RESET}`); }

async function testStripeKey() {
  log('Test de la clé Stripe...');
  try {
    await stripe.products.list({ limit: 1 });
    log('Clé Stripe valide!\n');
    return true;
  } catch (err) {
    error(`Clé invalide: ${err.message}`);
    return false;
  }
}

async function createStripeProducts() {
  log('Création produits Stripe...\n');

  const packs = [
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900, description: '100 crédits pour générer des designs avec l\'IA' },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900, description: '500 crédits pour générer des designs avec l\'IA - Best Value', badge: 'Best Value' },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900, description: '1000 crédits pour générer des designs avec l\'IA' },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Chercher produit existant
      const products = await stripe.products.list({ limit: 100, active: true });
      let product = products.data.find(p => 
        p.metadata?.pack_id === pack.id || 
        p.name === pack.name
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: pack.description,
          metadata: { pack_id: pack.id, credits: String(pack.credits), type: 'ai_credits' },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ product: product.id, limit: 10, active: true });
      let price = prices.data.find(p => p.unit_amount === pack.priceCents && p.currency === 'eur');

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits), type: 'ai_credits' },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID final: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, productId: product.id, name: pack.name });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 100)}`);
    }
  }

  return results;
}

async function updateDatabase(results) {
  if (results.length === 0) {
    warn('Aucun Price ID à mettre à jour\n');
    return false;
  }

  log('Mise à jour Price IDs dans la DB...\n');

  try {
    for (const r of results) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        r.priceId,
        r.packId
      );
      console.log(`  ✅ ${r.name}: ${r.priceId}`);
    }
    log('\n✅ DB mise à jour avec succès!\n');
    return true;
  } catch (err) {
    error(`Erreur DB: ${err.message.substring(0, 100)}`);
    console.log('\n📝 SQL manuel:');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    return false;
  }
}

async function verifyDatabase() {
  log('Vérification DB...\n');
  
  try {
    const packs = await prisma.$queryRaw`
      SELECT id, name, "stripe_price_id", credits 
      FROM "CreditPack" 
      ORDER BY credits
    `;
    
    console.log('📊 Packs dans la DB:');
    let allOk = true;
    packs.forEach(pack => {
      if (pack.stripe_price_id) {
        console.log(`  ✅ ${pack.name} (${pack.credits} crédits): ${pack.stripe_price_id}`);
      } else {
        console.log(`  ⚠️  ${pack.name}: Pas de Price ID`);
        allOk = false;
      }
    });
    console.log('');
    
    return allOk;
  } catch (err) {
    error(`Erreur vérification: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function deployVercel() {
  log('Déploiement Vercel...\n');

  // Frontend
  const frontendPath = path.join(__dirname, '../../frontend');
  if (fs.existsSync(frontendPath)) {
    log('Frontend...');
    try {
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: frontendPath,
        env: { ...process.env, STRIPE_SECRET_KEY }
      });
      log('✅ Frontend déployé\n');
    } catch (err) {
      warn(`Frontend: ${err.message.substring(0, 60)}\n`);
    }
  }

  // Backend
  const backendPath = path.join(__dirname, '..');
  if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
    log('Backend...');
    try {
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: backendPath,
        env: { ...process.env, STRIPE_SECRET_KEY }
      });
      log('✅ Backend déployé\n');
    } catch (err) {
      warn(`Backend: ${err.message.substring(0, 60)}\n`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 SETUP COMPLET STRIPE + DB + DÉPLOIEMENT 🚀                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test clé
    if (!(await testStripeKey())) {
      process.exit(1);
    }

    // 2. Créer produits
    const results = await createStripeProducts();
    
    if (results.length === 0) {
      error('Aucun produit créé');
      process.exit(1);
    }

    // 3. Update DB
    await updateDatabase(results);

    // 4. Vérifier
    await verifyDatabase();

    // 5. Déployer
    await deployVercel();

    console.log('🎉 TOUT EST TERMINÉ AVEC SUCCÈS!\n');
    
    console.log('📋 Résumé:');
    results.forEach(r => {
      console.log(`  ${r.name}:`);
      console.log(`    Product ID: ${r.productId}`);
      console.log(`    Price ID: ${r.priceId}`);
    });
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


#!/usr/bin/env node

/**
 * Script final: Créer produits Stripe + Update DB avec la vraie clé
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clé Stripe depuis variable d'environnement
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Charger DATABASE_URL
const envSupabasePath = path.join(__dirname, '../../.env.supabase');
if (fs.existsSync(envSupabasePath)) {
  const envContent = fs.readFileSync(envSupabasePath, 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbMatch && !dbMatch[1].includes('[PASSWORD]')) {
    process.env.DATABASE_URL = dbMatch[1].replace(/^["']|["']$/g, '').trim();
  }
}

const prisma = new PrismaClient();
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function error(msg) { console.log(`${RED}❌ ${msg}${RESET}`); }

async function testStripeKey() {
  log('Test de la clé Stripe...');
  try {
    await stripe.products.list({ limit: 1 });
    log('Clé Stripe valide!\n');
    return true;
  } catch (err) {
    error(`Clé invalide: ${err.message}`);
    return false;
  }
}

async function createStripeProducts() {
  log('Création produits Stripe...\n');

  const packs = [
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900, description: '100 crédits pour générer des designs avec l\'IA' },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900, description: '500 crédits pour générer des designs avec l\'IA - Best Value', badge: 'Best Value' },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900, description: '1000 crédits pour générer des designs avec l\'IA' },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Chercher produit existant
      const products = await stripe.products.list({ limit: 100, active: true });
      let product = products.data.find(p => 
        p.metadata?.pack_id === pack.id || 
        p.name === pack.name
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: pack.description,
          metadata: { pack_id: pack.id, credits: String(pack.credits), type: 'ai_credits' },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ product: product.id, limit: 10, active: true });
      let price = prices.data.find(p => p.unit_amount === pack.priceCents && p.currency === 'eur');

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits), type: 'ai_credits' },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID final: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, productId: product.id, name: pack.name });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 100)}`);
    }
  }

  return results;
}

async function updateDatabase(results) {
  if (results.length === 0) {
    warn('Aucun Price ID à mettre à jour\n');
    return false;
  }

  log('Mise à jour Price IDs dans la DB...\n');

  try {
    for (const r of results) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        r.priceId,
        r.packId
      );
      console.log(`  ✅ ${r.name}: ${r.priceId}`);
    }
    log('\n✅ DB mise à jour avec succès!\n');
    return true;
  } catch (err) {
    error(`Erreur DB: ${err.message.substring(0, 100)}`);
    console.log('\n📝 SQL manuel:');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    return false;
  }
}

async function verifyDatabase() {
  log('Vérification DB...\n');
  
  try {
    const packs = await prisma.$queryRaw`
      SELECT id, name, "stripe_price_id", credits 
      FROM "CreditPack" 
      ORDER BY credits
    `;
    
    console.log('📊 Packs dans la DB:');
    let allOk = true;
    packs.forEach(pack => {
      if (pack.stripe_price_id) {
        console.log(`  ✅ ${pack.name} (${pack.credits} crédits): ${pack.stripe_price_id}`);
      } else {
        console.log(`  ⚠️  ${pack.name}: Pas de Price ID`);
        allOk = false;
      }
    });
    console.log('');
    
    return allOk;
  } catch (err) {
    error(`Erreur vérification: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function deployVercel() {
  log('Déploiement Vercel...\n');

  // Frontend
  const frontendPath = path.join(__dirname, '../../frontend');
  if (fs.existsSync(frontendPath)) {
    log('Frontend...');
    try {
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: frontendPath,
        env: { ...process.env, STRIPE_SECRET_KEY }
      });
      log('✅ Frontend déployé\n');
    } catch (err) {
      warn(`Frontend: ${err.message.substring(0, 60)}\n`);
    }
  }

  // Backend
  const backendPath = path.join(__dirname, '..');
  if (fs.existsSync(path.join(backendPath, 'vercel.json'))) {
    log('Backend...');
    try {
      execSync('vercel --prod --yes', { 
        stdio: 'inherit', 
        cwd: backendPath,
        env: { ...process.env, STRIPE_SECRET_KEY }
      });
      log('✅ Backend déployé\n');
    } catch (err) {
      warn(`Backend: ${err.message.substring(0, 60)}\n`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 SETUP COMPLET STRIPE + DB + DÉPLOIEMENT 🚀                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test clé
    if (!(await testStripeKey())) {
      process.exit(1);
    }

    // 2. Créer produits
    const results = await createStripeProducts();
    
    if (results.length === 0) {
      error('Aucun produit créé');
      process.exit(1);
    }

    // 3. Update DB
    await updateDatabase(results);

    // 4. Vérifier
    await verifyDatabase();

    // 5. Déployer
    await deployVercel();

    console.log('🎉 TOUT EST TERMINÉ AVEC SUCCÈS!\n');
    
    console.log('📋 Résumé:');
    results.forEach(r => {
      console.log(`  ${r.name}:`);
      console.log(`    Product ID: ${r.productId}`);
      console.log(`    Price ID: ${r.priceId}`);
    });
    console.log('');

  } catch (err) {
    error(`Erreur: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
























