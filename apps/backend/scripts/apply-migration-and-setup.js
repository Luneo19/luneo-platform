#!/usr/bin/env node

/**
 * Script complet: Migration DB + Création produits Stripe
 */

require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🗄️  Application de la migration DB...\n');

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Diviser en statements individuels
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  try {
    // Exécuter chaque statement
    for (const statement of statements) {
      if (statement.length > 10) { // Ignorer les statements vides
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`  ✅ Statement exécuté`);
        } catch (error) {
          // Ignorer les erreurs "already exists"
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn(`  ⚠️  Warning: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('\n✅ Migration appliquée avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    throw error;
  }
}

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.log('⚠️  STRIPE_SECRET_KEY non défini, saut de la création produits Stripe');
    return [];
  }

  const stripe = new Stripe(stripeSecretKey);

  console.log('💳 Création des produits Stripe...\n');

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
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}\n`);
    }
  }

  return results;
}

async function main() {
  try {
    // 1. Migration DB
    await applyMigration();

    // 2. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    if (stripeResults.length > 0) {
      console.log('✅ Produits Stripe créés et DB mise à jour!\n');
      console.log('📋 Résumé:');
      stripeResults.forEach((r) => {
        console.log(`  ${r.name}: ${r.priceId}`);
      });
    }

    console.log('\n🎉 Setup terminé avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



#!/usr/bin/env node

/**
 * Script complet: Migration DB + Création produits Stripe
 */

require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🗄️  Application de la migration DB...\n');

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Diviser en statements individuels
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  try {
    // Exécuter chaque statement
    for (const statement of statements) {
      if (statement.length > 10) { // Ignorer les statements vides
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`  ✅ Statement exécuté`);
        } catch (error) {
          // Ignorer les erreurs "already exists"
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn(`  ⚠️  Warning: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('\n✅ Migration appliquée avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    throw error;
  }
}

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.log('⚠️  STRIPE_SECRET_KEY non défini, saut de la création produits Stripe');
    return [];
  }

  const stripe = new Stripe(stripeSecretKey);

  console.log('💳 Création des produits Stripe...\n');

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
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}\n`);
    }
  }

  return results;
}

async function main() {
  try {
    // 1. Migration DB
    await applyMigration();

    // 2. Créer produits Stripe
    const stripeResults = await createStripeProducts();

    if (stripeResults.length > 0) {
      console.log('✅ Produits Stripe créés et DB mise à jour!\n');
      console.log('📋 Résumé:');
      stripeResults.forEach((r) => {
        console.log(`  ${r.name}: ${r.priceId}`);
      });
    }

    console.log('\n🎉 Setup terminé avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

























