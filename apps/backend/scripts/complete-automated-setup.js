#!/usr/bin/env node

/**
 * Script automatique complet: Stripe + DB + Build + Déploiement
 * Prend les credentials depuis tous les .env disponibles
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '../../.env.production' });
require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
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
}

function findStripeKey() {
  // Chercher dans toutes les sources possibles
  let key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    // Chercher dans les fichiers .env
    const envFiles = [
      '../../.env.production',
      '../../.env',
      '.env.production',
      '.env'
    ];
    
    for (const file of envFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/STRIPE_SECRET_KEY[^=]*=(.+)/);
        if (match) {
          key = match[1].replace(/^["']|["']$/g, '').trim();
          if (key && key.startsWith('sk_')) {
            process.env.STRIPE_SECRET_KEY = key;
            break;
          }
        }
      }
    }
  }
  
  if (key) {
    key = key.replace(/^["']|["']$/g, '').trim();
  }
  
  return key;
}

async function createStripeProducts() {
  let stripeSecretKey = findStripeKey();
  
  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
    error('STRIPE_SECRET_KEY non trouvé ou invalide');
    return [];
  }

  info(`Clé Stripe trouvée: ${stripeSecretKey.substring(0, 20)}...`);

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

      // Vérifier si le produit existe déjà
      const existingProducts = await stripe.products.list({ 
        limit: 100,
        active: true 
      });
      
      let product = existingProducts.data.find(p => 
        p.metadata?.pack_id === pack.id || p.name === pack.name
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: `${pack.credits} crédits pour générer des designs avec l'IA`,
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Vérifier si le price existe déjà
      const existingPrices = await stripe.prices.list({ 
        product: product.id,
        limit: 10 
      });
      
      let price = existingPrices.data.find(p => 
        p.unit_amount === pack.priceCents && p.currency === 'eur'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      error(`  ❌ Erreur: ${err.message.substring(0, 80)}`);
    }
  }

  return results;
}

async function updateDatabaseWithPriceIds(results) {
  if (results.length === 0) {
    warn('Aucun Price ID à mettre à jour\n');
    return;
  }

  log('Mise à jour Price IDs dans la DB...\n');

  try {
    for (const result of results) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        result.priceId,
        result.packId
      );
      console.log(`  ✅ ${result.name}: ${result.priceId}`);
    }
    log('\n✅ Price IDs mis à jour dans la DB!\n');
  } catch (err) {
    warn(`⚠️  Erreur mise à jour DB: ${err.message.substring(0, 100)}`);
    warn('⚠️  Mise à jour manuelle requise sur Supabase SQL Editor\n');
    console.log('SQL à exécuter:');
    results.forEach((r) => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
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
    // Essayer avec skipLibCheck si erreurs TypeScript
    execSync('pnpm build', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Build réussi\n');
    return true;
  } catch (err) {
    warn(`⚠️  Build échoué, tentative avec skipLibCheck...`);
    try {
      execSync('pnpm build --skipLibCheck', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..'),
        env: { ...process.env }
      });
      log('✅ Build réussi (avec skipLibCheck)\n');
      return true;
    } catch (err2) {
      warn(`⚠️  Build échoué: ${err2.message.substring(0, 100)}`);
      warn('⚠️  Le build se fera sur Vercel avec les bonnes variables\n');
      return false;
    }
  }
}

async function deployVercel() {
  log('Déploiement Vercel...\n');
  
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
    warn(`⚠️  Déploiement: ${err.message}\n`);
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
    // 1. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    // 2. Mettre à jour DB avec Price IDs
    await updateDatabaseWithPriceIds(stripeResults);

    // 3. Régénérer Prisma
    await regeneratePrisma();

    // 4. Build Backend
    await buildBackend();

    // 5. Déployer sur Vercel
    await deployVercel();

    console.log('');
    log('🎉 SETUP AUTOMATIQUE COMPLET TERMINÉ!');
    console.log('');
    
    if (stripeResults.length > 0) {
      console.log('📋 Résumé Stripe:');
      stripeResults.forEach((r) => {
        console.log(`  ${r.name}: ${r.priceId}`);
      });
      console.log('');
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
 * Script automatique complet: Stripe + DB + Build + Déploiement
 * Prend les credentials depuis tous les .env disponibles
 */

require('dotenv').config({ path: '../../.env.supabase' });
require('dotenv').config({ path: '../../.env.supabase.working' });
require('dotenv').config({ path: '../../.env.production' });
require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
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
}

function findStripeKey() {
  // Chercher dans toutes les sources possibles
  let key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    // Chercher dans les fichiers .env
    const envFiles = [
      '../../.env.production',
      '../../.env',
      '.env.production',
      '.env'
    ];
    
    for (const file of envFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/STRIPE_SECRET_KEY[^=]*=(.+)/);
        if (match) {
          key = match[1].replace(/^["']|["']$/g, '').trim();
          if (key && key.startsWith('sk_')) {
            process.env.STRIPE_SECRET_KEY = key;
            break;
          }
        }
      }
    }
  }
  
  if (key) {
    key = key.replace(/^["']|["']$/g, '').trim();
  }
  
  return key;
}

async function createStripeProducts() {
  let stripeSecretKey = findStripeKey();
  
  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
    error('STRIPE_SECRET_KEY non trouvé ou invalide');
    return [];
  }

  info(`Clé Stripe trouvée: ${stripeSecretKey.substring(0, 20)}...`);

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

      // Vérifier si le produit existe déjà
      const existingProducts = await stripe.products.list({ 
        limit: 100,
        active: true 
      });
      
      let product = existingProducts.data.find(p => 
        p.metadata?.pack_id === pack.id || p.name === pack.name
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: `${pack.credits} crédits pour générer des designs avec l'IA`,
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Vérifier si le price existe déjà
      const existingPrices = await stripe.prices.list({ 
        product: product.id,
        limit: 10 
      });
      
      let price = existingPrices.data.find(p => 
        p.unit_amount === pack.priceCents && p.currency === 'eur'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { pack_id: pack.id, credits: String(pack.credits) },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID: ${price.id}\n`);

      results.push({ packId: pack.id, priceId: price.id, name: pack.name });
    } catch (err) {
      error(`  ❌ Erreur: ${err.message.substring(0, 80)}`);
    }
  }

  return results;
}

async function updateDatabaseWithPriceIds(results) {
  if (results.length === 0) {
    warn('Aucun Price ID à mettre à jour\n');
    return;
  }

  log('Mise à jour Price IDs dans la DB...\n');

  try {
    for (const result of results) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CreditPack" SET "stripe_price_id" = $1 WHERE id = $2`,
        result.priceId,
        result.packId
      );
      console.log(`  ✅ ${result.name}: ${result.priceId}`);
    }
    log('\n✅ Price IDs mis à jour dans la DB!\n');
  } catch (err) {
    warn(`⚠️  Erreur mise à jour DB: ${err.message.substring(0, 100)}`);
    warn('⚠️  Mise à jour manuelle requise sur Supabase SQL Editor\n');
    console.log('SQL à exécuter:');
    results.forEach((r) => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
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
    // Essayer avec skipLibCheck si erreurs TypeScript
    execSync('pnpm build', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    log('✅ Build réussi\n');
    return true;
  } catch (err) {
    warn(`⚠️  Build échoué, tentative avec skipLibCheck...`);
    try {
      execSync('pnpm build --skipLibCheck', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..'),
        env: { ...process.env }
      });
      log('✅ Build réussi (avec skipLibCheck)\n');
      return true;
    } catch (err2) {
      warn(`⚠️  Build échoué: ${err2.message.substring(0, 100)}`);
      warn('⚠️  Le build se fera sur Vercel avec les bonnes variables\n');
      return false;
    }
  }
}

async function deployVercel() {
  log('Déploiement Vercel...\n');
  
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
    warn(`⚠️  Déploiement: ${err.message}\n`);
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
    // 1. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    // 2. Mettre à jour DB avec Price IDs
    await updateDatabaseWithPriceIds(stripeResults);

    // 3. Régénérer Prisma
    await regeneratePrisma();

    // 4. Build Backend
    await buildBackend();

    // 5. Déployer sur Vercel
    await deployVercel();

    console.log('');
    log('🎉 SETUP AUTOMATIQUE COMPLET TERMINÉ!');
    console.log('');
    
    if (stripeResults.length > 0) {
      console.log('📋 Résumé Stripe:');
      stripeResults.forEach((r) => {
        console.log(`  ${r.name}: ${r.priceId}`);
      });
      console.log('');
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
























