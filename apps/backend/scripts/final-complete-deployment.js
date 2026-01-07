#!/usr/bin/env node

/**
 * Script final: Test Stripe, Création produits, Update DB, Déploiement
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function error(msg) { console.log(`${RED}❌ ${msg}${RESET}`); }

async function testStripeKey() {
  let key = process.env.STRIPE_SECRET_KEY?.replace(/^["']|["']$/g, '').trim();
  
  if (!key || !key.startsWith('sk_')) {
    error('STRIPE_SECRET_KEY invalide');
    return null;
  }

  const stripe = new Stripe(key);
  
  try {
    await stripe.products.list({ limit: 1 });
    log(`Clé Stripe valide (${key.substring(0, 20)}...)`);
    return stripe;
  } catch (err) {
    error(`Clé Stripe invalide: ${err.message}`);
    return null;
  }
}

async function createStripeProducts(stripe) {
  if (!stripe) return [];

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

      // Chercher produit existant
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.metadata?.pack_id === pack.id);

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: `${pack.credits} crédits pour générer des designs avec l'IA`,
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ product: product.id, limit: 10 });
      let price = prices.data.find(p => p.unit_amount === pack.priceCents && p.currency === 'eur');

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
      }

      console.log(`  ✅ Price ID: ${price.id}\n`);
      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 60)}`);
    }
  }

  return results;
}

async function updateDatabase(results) {
  if (results.length === 0) return;

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
    log('\n✅ DB mise à jour!\n');
  } catch (err) {
    warn(`Erreur DB: ${err.message.substring(0, 80)}`);
    console.log('\nSQL manuel:');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
  }
}

async function deploy() {
  log('Déploiement Vercel...\n');

  // Frontend
  const frontendPath = path.join(__dirname, '../../frontend');
  if (fs.existsSync(frontendPath)) {
    log('Frontend...');
    try {
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: frontendPath, env: { ...process.env } });
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
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: backendPath, env: { ...process.env } });
      log('✅ Backend déployé\n');
    } catch (err) {
      warn(`Backend: ${err.message.substring(0, 60)}\n`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 DÉPLOIEMENT COMPLET AUTOMATIQUE 🚀                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test Stripe
    const stripe = await testStripeKey();
    
    // 2. Créer produits
    const results = await createStripeProducts(stripe);
    
    // 3. Update DB
    await updateDatabase(results);
    
    // 4. Déployer
    await deploy();

    console.log('\n🎉 DÉPLOIEMENT COMPLET TERMINÉ!\n');
    
    if (results.length > 0) {
      console.log('📋 Price IDs créés:');
      results.forEach(r => console.log(`  ${r.name}: ${r.priceId}`));
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();



#!/usr/bin/env node

/**
 * Script final: Test Stripe, Création produits, Update DB, Déploiement
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function error(msg) { console.log(`${RED}❌ ${msg}${RESET}`); }

async function testStripeKey() {
  let key = process.env.STRIPE_SECRET_KEY?.replace(/^["']|["']$/g, '').trim();
  
  if (!key || !key.startsWith('sk_')) {
    error('STRIPE_SECRET_KEY invalide');
    return null;
  }

  const stripe = new Stripe(key);
  
  try {
    await stripe.products.list({ limit: 1 });
    log(`Clé Stripe valide (${key.substring(0, 20)}...)`);
    return stripe;
  } catch (err) {
    error(`Clé Stripe invalide: ${err.message}`);
    return null;
  }
}

async function createStripeProducts(stripe) {
  if (!stripe) return [];

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

      // Chercher produit existant
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.metadata?.pack_id === pack.id);

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: `${pack.credits} crédits pour générer des designs avec l'IA`,
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ product: product.id, limit: 10 });
      let price = prices.data.find(p => p.unit_amount === pack.priceCents && p.currency === 'eur');

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
      }

      console.log(`  ✅ Price ID: ${price.id}\n`);
      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 60)}`);
    }
  }

  return results;
}

async function updateDatabase(results) {
  if (results.length === 0) return;

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
    log('\n✅ DB mise à jour!\n');
  } catch (err) {
    warn(`Erreur DB: ${err.message.substring(0, 80)}`);
    console.log('\nSQL manuel:');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
  }
}

async function deploy() {
  log('Déploiement Vercel...\n');

  // Frontend
  const frontendPath = path.join(__dirname, '../../frontend');
  if (fs.existsSync(frontendPath)) {
    log('Frontend...');
    try {
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: frontendPath, env: { ...process.env } });
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
      execSync('vercel --prod --yes', { stdio: 'inherit', cwd: backendPath, env: { ...process.env } });
      log('✅ Backend déployé\n');
    } catch (err) {
      warn(`Backend: ${err.message.substring(0, 60)}\n`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 DÉPLOIEMENT COMPLET AUTOMATIQUE 🚀                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test Stripe
    const stripe = await testStripeKey();
    
    // 2. Créer produits
    const results = await createStripeProducts(stripe);
    
    // 3. Update DB
    await updateDatabase(results);
    
    // 4. Déployer
    await deploy();

    console.log('\n🎉 DÉPLOIEMENT COMPLET TERMINÉ!\n');
    
    if (results.length > 0) {
      console.log('📋 Price IDs créés:');
      results.forEach(r => console.log(`  ${r.name}: ${r.priceId}`));
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();




























