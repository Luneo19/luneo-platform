#!/usr/bin/env node

/**
 * Script final: Créer produits Stripe + Update DB automatiquement
 * Prend les credentials depuis tous les .env disponibles
 */

require('dotenv').config({ path: '../../.env.production' });
require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Charger DATABASE_URL depuis .env.supabase
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
function info(msg) { console.log(`ℹ️  ${msg}`); }

function findStripeKey() {
  // Chercher dans toutes les sources
  const sources = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_KEY,
  ];

  // Chercher dans les fichiers
  const envFiles = [
    '../../.env.production',
    '../../.env',
    '.env.production',
    '.env',
    '../../apps/backend/.env.production',
    '../../apps/frontend/.env.production',
  ];

  for (const file of envFiles) {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('STRIPE') && line.includes('KEY') && !line.startsWith('#')) {
            const match = line.match(/[^=]*=(.+)/);
            if (match) {
              let key = match[1].trim();
              key = key.replace(/^["']|["']$/g, '');
              if (key && key.startsWith('sk_') && key.length > 50) {
                return key;
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // Vérifier les sources directes
  for (const key of sources) {
    if (key) {
      const clean = key.replace(/^["']|["']$/g, '').trim();
      if (clean && clean.startsWith('sk_') && clean.length > 50) {
        return clean;
      }
    }
  }

  return null;
}

async function testStripeKey(key) {
  if (!key) {
    error('Aucune clé Stripe trouvée');
    return null;
  }

  const stripe = new Stripe(key, {
    apiVersion: '2025-12-15.clover', // Version la plus récente selon le dashboard
  });

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
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900, description: '100 crédits pour générer des designs avec l\'IA' },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900, description: '500 crédits pour générer des designs avec l\'IA - Best Value', badge: 'Best Value' },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900, description: '1000 crédits pour générer des designs avec l\'IA' },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Chercher produit existant
      const products = await stripe.products.list({ 
        limit: 100,
        active: true 
      });
      
      let product = products.data.find(p => 
        p.metadata?.pack_id === pack.id || 
        p.name === pack.name ||
        (p.name.includes('100') && pack.id === 'pack_100') ||
        (p.name.includes('500') && pack.id === 'pack_500') ||
        (p.name.includes('1000') && pack.id === 'pack_1000')
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: pack.description,
          metadata: { 
            pack_id: pack.id, 
            credits: String(pack.credits),
            type: 'ai_credits'
          },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 10,
        active: true
      });
      
      let price = prices.data.find(p => 
        p.unit_amount === pack.priceCents && 
        p.currency === 'eur'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { 
            pack_id: pack.id, 
            credits: String(pack.credits),
            type: 'ai_credits'
          },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID final: ${price.id}\n`);

      results.push({ 
        packId: pack.id, 
        priceId: price.id, 
        productId: product.id,
        name: pack.name 
      });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 100)}`);
      if (err.code) {
        error(`  Code: ${err.code}`);
      }
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
    console.log('\n📝 SQL manuel à exécuter sur Supabase:');
    console.log('');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
    return false;
  }
}

async function verifyDatabase() {
  log('Vérification DB...\n');
  
  try {
    const packs = await prisma.$queryRaw`
      SELECT id, name, "stripe_price_id" 
      FROM "CreditPack" 
      ORDER BY credits
    `;
    
    console.log('📊 Packs dans la DB:');
    packs.forEach(pack => {
      if (pack.stripe_price_id) {
        console.log(`  ✅ ${pack.name}: ${pack.stripe_price_id}`);
      } else {
        console.log(`  ⚠️  ${pack.name}: Pas de Price ID`);
      }
    });
    console.log('');
    
    return packs.every(p => p.stripe_price_id);
  } catch (err) {
    error(`Erreur vérification: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 CRÉATION PRODUITS STRIPE + UPDATE DB 🚀                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Trouver clé Stripe
    info('Recherche clé Stripe...');
    const stripeKey = findStripeKey();
    
    if (!stripeKey) {
      error('Clé Stripe non trouvée dans les fichiers .env');
      console.log('\n📝 Veuillez fournir la clé Stripe:');
      console.log('   Format: sk_live_... ou sk_test_...');
      process.exit(1);
    }

    // 2. Tester clé
    const stripe = await testStripeKey(stripeKey);
    if (!stripe) {
      error('Clé Stripe invalide');
      process.exit(1);
    }

    // 3. Créer produits
    const results = await createStripeProducts(stripe);
    
    if (results.length === 0) {
      error('Aucun produit créé');
      process.exit(1);
    }

    // 4. Update DB
    const dbUpdated = await updateDatabase(results);

    // 5. Vérifier
    if (dbUpdated) {
      await verifyDatabase();
    }

    console.log('🎉 TERMINÉ AVEC SUCCÈS!\n');
    
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
 * Script final: Créer produits Stripe + Update DB automatiquement
 * Prend les credentials depuis tous les .env disponibles
 */

require('dotenv').config({ path: '../../.env.production' });
require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Charger DATABASE_URL depuis .env.supabase
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
function info(msg) { console.log(`ℹ️  ${msg}`); }

function findStripeKey() {
  // Chercher dans toutes les sources
  const sources = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_KEY,
  ];

  // Chercher dans les fichiers
  const envFiles = [
    '../../.env.production',
    '../../.env',
    '.env.production',
    '.env',
    '../../apps/backend/.env.production',
    '../../apps/frontend/.env.production',
  ];

  for (const file of envFiles) {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('STRIPE') && line.includes('KEY') && !line.startsWith('#')) {
            const match = line.match(/[^=]*=(.+)/);
            if (match) {
              let key = match[1].trim();
              key = key.replace(/^["']|["']$/g, '');
              if (key && key.startsWith('sk_') && key.length > 50) {
                return key;
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // Vérifier les sources directes
  for (const key of sources) {
    if (key) {
      const clean = key.replace(/^["']|["']$/g, '').trim();
      if (clean && clean.startsWith('sk_') && clean.length > 50) {
        return clean;
      }
    }
  }

  return null;
}

async function testStripeKey(key) {
  if (!key) {
    error('Aucune clé Stripe trouvée');
    return null;
  }

  const stripe = new Stripe(key, {
    apiVersion: '2025-12-15.clover', // Version la plus récente selon le dashboard
  });

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
    { id: 'pack_100', name: 'Pack 100 Crédits IA', credits: 100, priceCents: 1900, description: '100 crédits pour générer des designs avec l\'IA' },
    { id: 'pack_500', name: 'Pack 500 Crédits IA', credits: 500, priceCents: 7900, description: '500 crédits pour générer des designs avec l\'IA - Best Value', badge: 'Best Value' },
    { id: 'pack_1000', name: 'Pack 1000 Crédits IA', credits: 1000, priceCents: 13900, description: '1000 crédits pour générer des designs avec l\'IA' },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 ${pack.name}...`);

      // Chercher produit existant
      const products = await stripe.products.list({ 
        limit: 100,
        active: true 
      });
      
      let product = products.data.find(p => 
        p.metadata?.pack_id === pack.id || 
        p.name === pack.name ||
        (p.name.includes('100') && pack.id === 'pack_100') ||
        (p.name.includes('500') && pack.id === 'pack_500') ||
        (p.name.includes('1000') && pack.id === 'pack_1000')
      );

      if (!product) {
        product = await stripe.products.create({
          name: pack.name,
          description: pack.description,
          metadata: { 
            pack_id: pack.id, 
            credits: String(pack.credits),
            type: 'ai_credits'
          },
        });
        console.log(`  ✅ Produit créé: ${product.id}`);
      } else {
        console.log(`  ℹ️  Produit existant: ${product.id}`);
      }

      // Chercher price existant
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 10,
        active: true
      });
      
      let price = prices.data.find(p => 
        p.unit_amount === pack.priceCents && 
        p.currency === 'eur'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: pack.priceCents,
          currency: 'eur',
          metadata: { 
            pack_id: pack.id, 
            credits: String(pack.credits),
            type: 'ai_credits'
          },
        });
        console.log(`  ✅ Price créé: ${price.id}`);
      } else {
        console.log(`  ℹ️  Price existant: ${price.id}`);
      }

      console.log(`  ✅ Price ID final: ${price.id}\n`);

      results.push({ 
        packId: pack.id, 
        priceId: price.id, 
        productId: product.id,
        name: pack.name 
      });
    } catch (err) {
      error(`  Erreur: ${err.message.substring(0, 100)}`);
      if (err.code) {
        error(`  Code: ${err.code}`);
      }
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
    console.log('\n📝 SQL manuel à exécuter sur Supabase:');
    console.log('');
    results.forEach(r => {
      console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${r.priceId}' WHERE id = '${r.packId}';`);
    });
    console.log('');
    return false;
  }
}

async function verifyDatabase() {
  log('Vérification DB...\n');
  
  try {
    const packs = await prisma.$queryRaw`
      SELECT id, name, "stripe_price_id" 
      FROM "CreditPack" 
      ORDER BY credits
    `;
    
    console.log('📊 Packs dans la DB:');
    packs.forEach(pack => {
      if (pack.stripe_price_id) {
        console.log(`  ✅ ${pack.name}: ${pack.stripe_price_id}`);
      } else {
        console.log(`  ⚠️  ${pack.name}: Pas de Price ID`);
      }
    });
    console.log('');
    
    return packs.every(p => p.stripe_price_id);
  } catch (err) {
    error(`Erreur vérification: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 CRÉATION PRODUITS STRIPE + UPDATE DB 🚀                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Trouver clé Stripe
    info('Recherche clé Stripe...');
    const stripeKey = findStripeKey();
    
    if (!stripeKey) {
      error('Clé Stripe non trouvée dans les fichiers .env');
      console.log('\n📝 Veuillez fournir la clé Stripe:');
      console.log('   Format: sk_live_... ou sk_test_...');
      process.exit(1);
    }

    // 2. Tester clé
    const stripe = await testStripeKey(stripeKey);
    if (!stripe) {
      error('Clé Stripe invalide');
      process.exit(1);
    }

    // 3. Créer produits
    const results = await createStripeProducts(stripe);
    
    if (results.length === 0) {
      error('Aucun produit créé');
      process.exit(1);
    }

    // 4. Update DB
    const dbUpdated = await updateDatabase(results);

    // 5. Vérifier
    if (dbUpdated) {
      await verifyDatabase();
    }

    console.log('🎉 TERMINÉ AVEC SUCCÈS!\n');
    
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



























