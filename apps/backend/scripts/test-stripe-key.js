#!/usr/bin/env node

/**
 * Test rapide d'une clé Stripe
 * Usage: node test-stripe-key.js sk_live_...
 */

const Stripe = require('stripe');

const key = process.argv[2];

if (!key) {
  console.log('❌ Usage: node test-stripe-key.js sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(key, {
  apiVersion: '2025-12-15.clover',
});

console.log('🔍 Test de la clé Stripe...\n');
console.log(`Clé: ${key.substring(0, 20)}...${key.substring(key.length - 8)}`);
console.log(`Longueur: ${key.length} caractères\n`);

stripe.products.list({ limit: 1 })
  .then(() => {
    console.log('✅ Clé valide! La clé fonctionne.\n');
    console.log('📝 Vous pouvez maintenant utiliser cette clé pour créer les produits.');
    process.exit(0);
  })
  .catch(err => {
    console.log(`❌ Erreur: ${err.message}`);
    if (err.code) {
      console.log(`Code: ${err.code}`);
    }
    if (err.type) {
      console.log(`Type: ${err.type}`);
    }
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Test rapide d'une clé Stripe
 * Usage: node test-stripe-key.js sk_live_...
 */

const Stripe = require('stripe');

const key = process.argv[2];

if (!key) {
  console.log('❌ Usage: node test-stripe-key.js sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(key, {
  apiVersion: '2025-12-15.clover',
});

console.log('🔍 Test de la clé Stripe...\n');
console.log(`Clé: ${key.substring(0, 20)}...${key.substring(key.length - 8)}`);
console.log(`Longueur: ${key.length} caractères\n`);

stripe.products.list({ limit: 1 })
  .then(() => {
    console.log('✅ Clé valide! La clé fonctionne.\n');
    console.log('📝 Vous pouvez maintenant utiliser cette clé pour créer les produits.');
    process.exit(0);
  })
  .catch(err => {
    console.log(`❌ Erreur: ${err.message}`);
    if (err.code) {
      console.log(`Code: ${err.code}`);
    }
    if (err.type) {
      console.log(`Type: ${err.type}`);
    }
    process.exit(1);
  });



























