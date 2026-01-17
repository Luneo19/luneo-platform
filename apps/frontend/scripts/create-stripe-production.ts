/**
 * Script pour créer les produits Stripe en PRODUCTION
 * Utilise la clé de production depuis Stripe CLI
 */

import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Fonction pour récupérer la clé Stripe de production
function getProductionStripeKey(): string {
  // 1. Depuis variable d'environnement explicite
  if (process.env.STRIPE_LIVE_SECRET_KEY && process.env.STRIPE_LIVE_SECRET_KEY.startsWith('sk_live_')) {
    return process.env.STRIPE_LIVE_SECRET_KEY;
  }

  // 2. Depuis .env.production
  try {
    const envContent = readFileSync('.env.production', 'utf-8');
    const match = envContent.match(/^STRIPE_SECRET_KEY=(.+)$/m);
    if (match && match[1] && match[1].includes('sk_live_')) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    // Fichier non trouvé, continuer
  }

  // 3. Depuis Stripe CLI (live mode)
  try {
    const configPath = require('os').homedir() + '/.config/stripe/config.toml';
    const config = readFileSync(configPath, 'utf-8');
    const match = config.match(/live_mode_api_key = '(.*)'/);
    if (match && match[1] && match[1].startsWith('sk_live_')) {
      return match[1];
    }
  } catch (e) {
    // CLI non configuré, continuer
  }

  throw new Error('Aucune clé Stripe de PRODUCTION trouvée. Une clé sk_live_ est requise.');
}

const STRIPE_SECRET_KEY = getProductionStripeKey();

if (!STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  throw new Error('ERREUR: La clé fournie n\'est pas une clé de PRODUCTION (doit commencer par sk_live_)');
}

console.log(`✅ Clé Stripe PRODUCTION trouvée: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
console.log('⚠️  ATTENTION: Vous créez des produits en PRODUCTION !\n');

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion,
});

// Configuration des plans (même que test)
const PLANS = [
  {
    id: 'starter',
    name: 'Luneo Starter',
    description: 'Parfait pour découvrir Luneo et créer vos premiers designs',
    priceMonthly: 0,
    priceYearly: 0,
  },
  {
    id: 'professional',
    name: 'Luneo Professional',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    priceMonthly: 2900, // 29€ en centimes
    priceYearly: 27840, // 278.40€ en centimes
  },
  {
    id: 'business',
    name: 'Luneo Business',
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    priceMonthly: 9900, // 99€ en centimes
    priceYearly: 95040, // 950.40€ en centimes
  },
];

const ADDONS = [
  {
    id: 'extra-designs',
    name: 'Designs supplémentaires',
    description: 'Pack de 100 designs supplémentaires par mois',
    priceMonthly: 2000,
    priceYearly: 19200,
  },
  {
    id: 'extra-storage',
    name: 'Stockage supplémentaire',
    description: '100 GB de stockage supplémentaire',
    priceMonthly: 500,
    priceYearly: 4800,
  },
  {
    id: 'extra-team-members',
    name: 'Membres d\'équipe supplémentaires',
    description: '10 membres d\'équipe supplémentaires',
    priceMonthly: 1000,
    priceYearly: 9600,
  },
  {
    id: 'extra-api-calls',
    name: 'API calls supplémentaires',
    description: 'Pack de 50,000 appels API supplémentaires par mois',
    priceMonthly: 1500,
    priceYearly: 14400,
  },
  {
    id: 'extra-renders-3d',
    name: 'Rendus 3D supplémentaires',
    description: 'Pack de 50 rendus 3D supplémentaires par mois',
    priceMonthly: 2500,
    priceYearly: 24000,
  },
];

async function main() {
  console.log('🚀 Création des produits Stripe en PRODUCTION\n');
  console.log('='.repeat(60));
  
  const results: any = { plans: {}, addOns: {} };

  // Créer les plans
  console.log('\n📦 Création des plans de base\n');
  
  for (const plan of PLANS) {
    try {
      console.log(`📋 Plan: ${plan.name}`);
      
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_id: plan.id, type: 'subscription_plan', environment: 'production' },
      });
      
      console.log(`   ✅ Produit: ${product.id}`);
      
      let monthlyPriceId: string | null = null;
      let yearlyPriceId: string | null = null;
      
      if (plan.priceMonthly > 0) {
        const monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceMonthly,
          currency: 'eur',
          recurring: { interval: 'month' },
          nickname: `${plan.id}-monthly`,
          metadata: { plan_id: plan.id, billing_cycle: 'monthly', type: 'subscription_plan', environment: 'production' },
        });
        monthlyPriceId = monthlyPrice.id;
        console.log(`   ✅ Prix mensuel: ${monthlyPrice.id} (${plan.priceMonthly / 100}€/mois)`);
      }
      
      if (plan.priceYearly > 0) {
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceYearly,
          currency: 'eur',
          recurring: { interval: 'year' },
          nickname: `${plan.id}-yearly`,
          metadata: { plan_id: plan.id, billing_cycle: 'yearly', type: 'subscription_plan', environment: 'production' },
        });
        yearlyPriceId = yearlyPrice.id;
        console.log(`   ✅ Prix annuel: ${yearlyPrice.id} (${plan.priceYearly / 100}€/an)`);
      }
      
      results.plans[plan.id] = { productId: product.id, monthlyPriceId, yearlyPriceId };
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
      if (error.code) console.error(`   Code: ${error.code}`);
    }
  }
  
  // Créer les add-ons
  console.log('\n\n🎁 Création des add-ons\n');
  
  for (const addon of ADDONS) {
    try {
      console.log(`🎁 Add-on: ${addon.name}`);
      
      const product = await stripe.products.create({
        name: addon.name,
        description: addon.description,
        metadata: { addon_id: addon.id, type: 'addon', environment: 'production' },
      });
      
      console.log(`   ✅ Produit: ${product.id}`);
      
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.priceMonthly,
        currency: 'eur',
        recurring: { interval: 'month' },
        nickname: `${addon.id}-monthly`,
        metadata: { addon_id: addon.id, billing_cycle: 'monthly', type: 'addon', environment: 'production' },
      });
      console.log(`   ✅ Prix mensuel: ${monthlyPrice.id} (${addon.priceMonthly / 100}€/mois)`);
      
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.priceYearly,
        currency: 'eur',
        recurring: { interval: 'year' },
        nickname: `${addon.id}-yearly`,
        metadata: { addon_id: addon.id, billing_cycle: 'yearly', type: 'addon', environment: 'production' },
      });
      console.log(`   ✅ Prix annuel: ${yearlyPrice.id} (${addon.priceYearly / 100}€/an)`);
      
      results.addOns[addon.id] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
      };
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
      if (error.code) console.error(`   Code: ${error.code}`);
    }
  }
  
  // Afficher le résumé
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 Variables d\'environnement PRODUCTION');
  console.log('='.repeat(60) + '\n');
  console.log('# Ajoutez ces variables dans Vercel (Settings > Environment Variables)');
  console.log('# OU dans .env.production\n');
  
  for (const [planId, config] of Object.entries(results.plans)) {
    const planUpper = planId.toUpperCase();
    console.log(`# ${planId}`);
    console.log(`STRIPE_PRODUCT_${planUpper}=${config.productId}`);
    if (config.monthlyPriceId) console.log(`STRIPE_PRICE_${planUpper}_MONTHLY=${config.monthlyPriceId}`);
    if (config.yearlyPriceId) console.log(`STRIPE_PRICE_${planUpper}_YEARLY=${config.yearlyPriceId}`);
    console.log('');
  }
  
  for (const [addonId, config] of Object.entries(results.addOns)) {
    const addonUpper = addonId.toUpperCase().replace(/-/g, '_');
    console.log(`# ${addonId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_PRODUCT_ID=${config.productId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_MONTHLY=${config.monthlyPriceId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_YEARLY=${config.yearlyPriceId}`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('✅ Produits PRODUCTION créés avec succès !');
  console.log('='.repeat(60));
}

main().catch(console.error);
