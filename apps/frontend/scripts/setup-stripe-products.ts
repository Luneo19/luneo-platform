/**
 * Script pour créer les produits et prix Stripe pour Luneo
 * 
 * Usage:
 * 1. Configurer STRIPE_SECRET_KEY dans .env.local
 * 2. Exécuter: npx ts-node scripts/setup-stripe-products.ts
 * 
 * Ce script va créer:
 * - 3 produits (Professional, Business, Enterprise)
 * - 6 prix (mensuel + annuel pour chaque produit)
 */

import Stripe from 'stripe';

// Vérifier la clé API
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY non configurée');
  console.log('\nPour configurer:');
  console.log('1. Allez sur https://dashboard.stripe.com/apikeys');
  console.log('2. Copiez votre clé secrète (sk_live_... ou sk_test_...)');
  console.log('3. Ajoutez-la dans .env.local: STRIPE_SECRET_KEY=sk_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion,
});

// Configuration des plans
const PLANS = [
  {
    id: 'professional',
    name: 'Luneo Professional',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    priceMonthly: 2900, // 29€ en centimes
    priceYearly: 27840, // 278.40€ en centimes (29€ x 12 mois - 20%)
    features: [
      '100 designs/mois',
      'Export HD illimité',
      'Configurateur 3D',
      'Support prioritaire',
      '10 intégrations',
      'API accès complet',
    ],
  },
  {
    id: 'business',
    name: 'Luneo Business',
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    priceMonthly: 5900, // 59€ en centimes
    priceYearly: 56640, // 566.40€ en centimes (59€ x 12 mois - 20%)
    features: [
      '500 designs/mois',
      'Virtual Try-On',
      'Multi-utilisateurs (10)',
      'Webhooks',
      'Marque blanche',
      'Support dédié',
    ],
  },
  {
    id: 'enterprise',
    name: 'Luneo Enterprise',
    description: 'Solution sur-mesure pour les grandes organisations',
    priceMonthly: 9900, // 99€ en centimes
    priceYearly: 95040, // 950.40€ en centimes (99€ x 12 mois - 20%)
    features: [
      'Designs illimités',
      'Utilisateurs illimités',
      'SLA 99.9%',
      'Account Manager',
      'Formation personnalisée',
      'Déploiement on-premise',
    ],
  },
];

async function setupStripeProducts() {
  console.log('🚀 Configuration des produits Stripe pour Luneo\n');

  const results: Record<string, { productId: string; monthlyPriceId: string; yearlyPriceId: string }> = {};

  for (const plan of PLANS) {
    console.log(`\n📦 Création du produit: ${plan.name}`);

    try {
      // Créer le produit
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          features: JSON.stringify(plan.features),
        },
        default_price_data: undefined,
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      // Créer le prix mensuel
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceMonthly,
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
        nickname: `${plan.id}-monthly`,
        metadata: {
          plan_id: plan.id,
          billing_cycle: 'monthly',
        },
      });

      console.log(`   ✅ Prix mensuel créé: ${monthlyPrice.id} (${plan.priceMonthly / 100}€/mois)`);

      // Créer le prix annuel
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceYearly,
        currency: 'eur',
        recurring: {
          interval: 'year',
        },
        nickname: `${plan.id}-yearly`,
        metadata: {
          plan_id: plan.id,
          billing_cycle: 'yearly',
        },
      });

      console.log(`   ✅ Prix annuel créé: ${yearlyPrice.id} (${plan.priceYearly / 100}€/an)`);

      results[plan.id] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
      };
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
    }
  }

  // Afficher le résumé
  console.log('\n\n========================================');
  console.log('📋 RÉSUMÉ - Variables d\'environnement à configurer');
  console.log('========================================\n');

  console.log('# Ajoutez ces variables dans Vercel ou .env.local:\n');

  for (const [planId, config] of Object.entries(results)) {
    const planUpper = planId.toUpperCase();
    console.log(`# ${planId.charAt(0).toUpperCase() + planId.slice(1)}`);
    console.log(`STRIPE_PRODUCT_${planUpper}=${config.productId}`);
    console.log(`STRIPE_PRICE_${planUpper}_MONTHLY=${config.monthlyPriceId}`);
    console.log(`STRIPE_PRICE_${planUpper}_YEARLY=${config.yearlyPriceId}`);
    console.log('');
  }

  console.log('\n========================================');
  console.log('✅ Configuration terminée !');
  console.log('========================================\n');

  console.log('Prochaines étapes:');
  console.log('1. Copiez les variables ci-dessus');
  console.log('2. Ajoutez-les dans Vercel: Settings > Environment Variables');
  console.log('3. Redéployez l\'application');
  console.log('\nPour un environnement de test, utilisez des clés sk_test_...');
  console.log('Pour la production, utilisez des clés sk_live_...\n');
}

// Exécuter le script
setupStripeProducts().catch(console.error);

