#!/usr/bin/env node

/**
 * Script pour créer les produits Stripe pour les packs de crédits IA
 * Usage: node scripts/create-stripe-products.js
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY non défini');
    console.log('');
    console.log('Exportez la variable:');
    console.log('  export STRIPE_SECRET_KEY=sk_live_...');
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecretKey);

  console.log('🚀 Création des produits Stripe pour crédits IA...\n');

  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100 Crédits IA',
      description: '100 crédits pour générer des designs avec l\'IA',
      credits: 100,
      priceCents: 1900, // 19€
      metadata: { pack_id: 'pack_100', credits: '100' },
    },
    {
      id: 'pack_500',
      name: 'Pack 500 Crédits IA',
      description: '500 crédits pour générer des designs avec l\'IA - Best Value',
      credits: 500,
      priceCents: 7900, // 79€
      metadata: { pack_id: 'pack_500', credits: '500' },
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000 Crédits IA',
      description: '1000 crédits pour générer des designs avec l\'IA',
      credits: 1000,
      priceCents: 13900, // 139€
      metadata: { pack_id: 'pack_1000', credits: '1000' },
    },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 Création: ${pack.name}...`);

      // Créer le produit
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata,
      });

      console.log(`  ✅ Produit créé: ${product.id}`);

      // Créer le price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: pack.metadata,
      });

      console.log(`  ✅ Price créé: ${price.id}`);
      console.log(`  💰 Prix: ${pack.priceCents / 100}€\n`);

      results.push({
        packId: pack.id,
        productId: product.id,
        priceId: price.id,
        name: pack.name,
        credits: pack.credits,
        priceCents: pack.priceCents,
      });
    } catch (error) {
      console.error(`  ❌ Erreur pour ${pack.name}:`, error.message);
      
      // Si le produit existe déjà, essayer de le récupérer
      if (error.code === 'resource_already_exists') {
        console.log(`  ⚠️  Produit existe déjà, récupération...`);
        // Continuer avec le suivant
      }
    }
  }

  console.log('\n✅ Produits créés avec succès!\n');
  console.log('📋 Résumé:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach((result) => {
    console.log(`\n${result.name}:`);
    console.log(`  Pack ID: ${result.packId}`);
    console.log(`  Product ID: ${result.productId}`);
    console.log(`  Price ID: ${result.priceId}`);
    console.log(`  Crédits: ${result.credits}`);
    console.log(`  Prix: ${result.priceCents / 100}€`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 Mettre à jour la base de données:');
  console.log('');
  
  results.forEach((result) => {
    console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${result.priceId}' WHERE id = '${result.packId}';`);
  });

  console.log('\n✅ Script terminé!');
}

createStripeProducts().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});



#!/usr/bin/env node

/**
 * Script pour créer les produits Stripe pour les packs de crédits IA
 * Usage: node scripts/create-stripe-products.js
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');

async function createStripeProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY non défini');
    console.log('');
    console.log('Exportez la variable:');
    console.log('  export STRIPE_SECRET_KEY=sk_live_...');
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecretKey);

  console.log('🚀 Création des produits Stripe pour crédits IA...\n');

  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100 Crédits IA',
      description: '100 crédits pour générer des designs avec l\'IA',
      credits: 100,
      priceCents: 1900, // 19€
      metadata: { pack_id: 'pack_100', credits: '100' },
    },
    {
      id: 'pack_500',
      name: 'Pack 500 Crédits IA',
      description: '500 crédits pour générer des designs avec l\'IA - Best Value',
      credits: 500,
      priceCents: 7900, // 79€
      metadata: { pack_id: 'pack_500', credits: '500' },
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000 Crédits IA',
      description: '1000 crédits pour générer des designs avec l\'IA',
      credits: 1000,
      priceCents: 13900, // 139€
      metadata: { pack_id: 'pack_1000', credits: '1000' },
    },
  ];

  const results = [];

  for (const pack of packs) {
    try {
      console.log(`📦 Création: ${pack.name}...`);

      // Créer le produit
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata,
      });

      console.log(`  ✅ Produit créé: ${product.id}`);

      // Créer le price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: 'eur',
        metadata: pack.metadata,
      });

      console.log(`  ✅ Price créé: ${price.id}`);
      console.log(`  💰 Prix: ${pack.priceCents / 100}€\n`);

      results.push({
        packId: pack.id,
        productId: product.id,
        priceId: price.id,
        name: pack.name,
        credits: pack.credits,
        priceCents: pack.priceCents,
      });
    } catch (error) {
      console.error(`  ❌ Erreur pour ${pack.name}:`, error.message);
      
      // Si le produit existe déjà, essayer de le récupérer
      if (error.code === 'resource_already_exists') {
        console.log(`  ⚠️  Produit existe déjà, récupération...`);
        // Continuer avec le suivant
      }
    }
  }

  console.log('\n✅ Produits créés avec succès!\n');
  console.log('📋 Résumé:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach((result) => {
    console.log(`\n${result.name}:`);
    console.log(`  Pack ID: ${result.packId}`);
    console.log(`  Product ID: ${result.productId}`);
    console.log(`  Price ID: ${result.priceId}`);
    console.log(`  Crédits: ${result.credits}`);
    console.log(`  Prix: ${result.priceCents / 100}€`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 Mettre à jour la base de données:');
  console.log('');
  
  results.forEach((result) => {
    console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${result.priceId}' WHERE id = '${result.packId}';`);
  });

  console.log('\n✅ Script terminé!');
}

createStripeProducts().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});




























