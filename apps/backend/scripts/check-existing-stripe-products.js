#!/usr/bin/env node

/**
 * Vérifier les produits Stripe existants
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');

async function checkStripe() {
  // Demander la clé à l'utilisateur ou utiliser celle de l'env
  let key = process.argv[2] || process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    console.log('❌ Aucune clé Stripe fournie');
    console.log('Usage: node check-existing-stripe-products.js sk_live_...');
    process.exit(1);
  }

  key = key.replace(/^["']|["']$/g, '').trim();

  const stripe = new Stripe(key);

  try {
    console.log('🔍 Recherche produits Stripe existants...\n');

    // Lister tous les produits
    const products = await stripe.products.list({ limit: 100, active: true });
    
    console.log(`📦 ${products.data.length} produits trouvés:\n`);

    const creditPacks = [];

    for (const product of products.data) {
      // Chercher les prices
      const prices = await stripe.prices.list({ 
        product: product.id, 
        limit: 10,
        active: true 
      });

      for (const price of prices.data) {
        if (price.currency === 'eur') {
          const amount = price.unit_amount / 100; // Convertir en euros
          
          // Détecter si c'est un pack de crédits
          if (
            product.name.includes('Crédit') || 
            product.name.includes('Credit') ||
            product.metadata?.pack_id ||
            (amount >= 15 && amount <= 150)
          ) {
            creditPacks.push({
              productId: product.id,
              productName: product.name,
              priceId: price.id,
              amount: amount,
              metadata: product.metadata,
            });
          }
        }
      }
    }

    if (creditPacks.length > 0) {
      console.log('✅ Packs de crédits trouvés:\n');
      creditPacks.forEach(pack => {
        console.log(`📦 ${pack.productName}`);
        console.log(`   Product ID: ${pack.productId}`);
        console.log(`   Price ID: ${pack.priceId}`);
        console.log(`   Prix: ${pack.amount}€`);
        if (pack.metadata?.pack_id) {
          console.log(`   Pack ID: ${pack.metadata.pack_id}`);
        }
        console.log('');
      });

      console.log('\n📝 SQL pour mettre à jour la DB:');
      console.log('');
      creditPacks.forEach(pack => {
        const packId = pack.metadata?.pack_id || 
          (pack.amount === 19 ? 'pack_100' : 
           pack.amount === 79 ? 'pack_500' : 
           pack.amount === 139 ? 'pack_1000' : null);
        
        if (packId) {
          console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${pack.priceId}' WHERE id = '${packId}';`);
        }
      });
    } else {
      console.log('⚠️  Aucun pack de crédits trouvé');
      console.log('\n📝 Créer les produits manuellement ou fournir une clé Stripe valide');
    }

  } catch (err) {
    console.log(`❌ Erreur: ${err.message}`);
    if (err.code === 'invalid_api_key') {
      console.log('\n⚠️  Clé Stripe invalide');
      console.log('Veuillez fournir une clé valide:');
      console.log('  node check-existing-stripe-products.js sk_live_...');
    }
  }
}

checkStripe();


#!/usr/bin/env node

/**
 * Vérifier les produits Stripe existants
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const Stripe = require('stripe');

async function checkStripe() {
  // Demander la clé à l'utilisateur ou utiliser celle de l'env
  let key = process.argv[2] || process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    console.log('❌ Aucune clé Stripe fournie');
    console.log('Usage: node check-existing-stripe-products.js sk_live_...');
    process.exit(1);
  }

  key = key.replace(/^["']|["']$/g, '').trim();

  const stripe = new Stripe(key);

  try {
    console.log('🔍 Recherche produits Stripe existants...\n');

    // Lister tous les produits
    const products = await stripe.products.list({ limit: 100, active: true });
    
    console.log(`📦 ${products.data.length} produits trouvés:\n`);

    const creditPacks = [];

    for (const product of products.data) {
      // Chercher les prices
      const prices = await stripe.prices.list({ 
        product: product.id, 
        limit: 10,
        active: true 
      });

      for (const price of prices.data) {
        if (price.currency === 'eur') {
          const amount = price.unit_amount / 100; // Convertir en euros
          
          // Détecter si c'est un pack de crédits
          if (
            product.name.includes('Crédit') || 
            product.name.includes('Credit') ||
            product.metadata?.pack_id ||
            (amount >= 15 && amount <= 150)
          ) {
            creditPacks.push({
              productId: product.id,
              productName: product.name,
              priceId: price.id,
              amount: amount,
              metadata: product.metadata,
            });
          }
        }
      }
    }

    if (creditPacks.length > 0) {
      console.log('✅ Packs de crédits trouvés:\n');
      creditPacks.forEach(pack => {
        console.log(`📦 ${pack.productName}`);
        console.log(`   Product ID: ${pack.productId}`);
        console.log(`   Price ID: ${pack.priceId}`);
        console.log(`   Prix: ${pack.amount}€`);
        if (pack.metadata?.pack_id) {
          console.log(`   Pack ID: ${pack.metadata.pack_id}`);
        }
        console.log('');
      });

      console.log('\n📝 SQL pour mettre à jour la DB:');
      console.log('');
      creditPacks.forEach(pack => {
        const packId = pack.metadata?.pack_id || 
          (pack.amount === 19 ? 'pack_100' : 
           pack.amount === 79 ? 'pack_500' : 
           pack.amount === 139 ? 'pack_1000' : null);
        
        if (packId) {
          console.log(`UPDATE "CreditPack" SET "stripe_price_id" = '${pack.priceId}' WHERE id = '${packId}';`);
        }
      });
    } else {
      console.log('⚠️  Aucun pack de crédits trouvé');
      console.log('\n📝 Créer les produits manuellement ou fournir une clé Stripe valide');
    }

  } catch (err) {
    console.log(`❌ Erreur: ${err.message}`);
    if (err.code === 'invalid_api_key') {
      console.log('\n⚠️  Clé Stripe invalide');
      console.log('Veuillez fournir une clé valide:');
      console.log('  node check-existing-stripe-products.js sk_live_...');
    }
  }
}

checkStripe();

























