/**
 * Script complet pour créer tous les produits et prix Stripe pour Luneo
 * Inclut les plans de base et les add-ons
 * 
 * Usage:
 * 1. Configurer STRIPE_SECRET_KEY dans .env.local
 * 2. Exécuter: npx tsx scripts/setup-stripe-pricing-complete.ts
 * 
 * Ce script va créer:
 * - 3 plans (Starter gratuit, Professional, Business)
 * - 6 prix de base (mensuel + annuel pour chaque plan payant)
 * - Add-ons: Designs supplémentaires, Stockage, API calls, etc.
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

// Configuration des plans de base
const PLANS = [
  {
    id: 'starter',
    name: 'Luneo Starter',
    description: 'Parfait pour découvrir Luneo et créer vos premiers designs',
    priceMonthly: 0, // Gratuit
    priceYearly: 0, // Gratuit
    features: [
      '50 designs/mois',
      'Customizer 2D',
      '100 rendus 2D/mois',
      '10 rendus 3D/mois',
      'Export PNG/PDF',
      'Support email',
      '3 membres d\'équipe',
      '5 GB stockage',
    ],
  },
  {
    id: 'professional',
    name: 'Luneo Professional',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    priceMonthly: 2900, // 29€ en centimes
    priceYearly: 27840, // 278.40€ en centimes (29€ x 12 mois - 20% = 23.20€/mois)
    features: [
      '250 designs/mois',
      'Customizer 2D + 3D',
      '500 rendus 2D/mois',
      '50 rendus 3D/mois',
      'Virtual Try-On',
      'API access',
      'Support prioritaire',
      '10 membres d\'équipe',
      '50 GB stockage',
      'Branding personnalisé',
      'Webhooks temps réel',
    ],
  },
  {
    id: 'business',
    name: 'Luneo Business',
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    priceMonthly: 9900, // 99€ en centimes
    priceYearly: 95040, // 950.40€ en centimes (99€ x 12 mois - 20% = 79.20€/mois)
    features: [
      '1000 designs/mois',
      'Toutes les fonctionnalités Pro',
      '2000 rendus 2D/mois',
      '200 rendus 3D/mois',
      'White-label complet',
      'API & SDKs',
      'Support dédié',
      '50 membres d\'équipe',
      '100 GB stockage',
      'SLA 99.5%',
      'Analytics avancés',
    ],
  },
];

// Configuration des add-ons
const ADDONS = [
  {
    id: 'extra-designs',
    name: 'Designs supplémentaires',
    description: 'Pack de 100 designs supplémentaires par mois',
    priceMonthly: 2000, // 20€/mois en centimes
    priceYearly: 19200, // 192€/an (20€ x 12 - 20% = 16€/mois)
    unitLabel: 'Pack de 100',
  },
  {
    id: 'extra-storage',
    name: 'Stockage supplémentaire',
    description: '100 GB de stockage supplémentaire',
    priceMonthly: 500, // 5€/mois en centimes
    priceYearly: 4800, // 48€/an (5€ x 12 - 20% = 4€/mois)
    unitLabel: '100 GB',
  },
  {
    id: 'extra-team-members',
    name: 'Membres d\'équipe supplémentaires',
    description: '10 membres d\'équipe supplémentaires',
    priceMonthly: 1000, // 10€/mois en centimes
    priceYearly: 9600, // 96€/an (10€ x 12 - 20% = 8€/mois)
    unitLabel: '10 membres',
  },
  {
    id: 'extra-api-calls',
    name: 'API calls supplémentaires',
    description: 'Pack de 50,000 appels API supplémentaires par mois',
    priceMonthly: 1500, // 15€/mois en centimes
    priceYearly: 14400, // 144€/an (15€ x 12 - 20% = 12€/mois)
    unitLabel: '50K appels',
  },
  {
    id: 'extra-renders-3d',
    name: 'Rendus 3D supplémentaires',
    description: 'Pack de 50 rendus 3D supplémentaires par mois',
    priceMonthly: 2500, // 25€/mois en centimes
    priceYearly: 24000, // 240€/an (25€ x 12 - 20% = 20€/mois)
    unitLabel: '50 rendus',
  },
];

interface SetupResult {
  plans: Record<string, { productId: string; monthlyPriceId: string | null; yearlyPriceId: string | null }>;
  addOns: Record<string, { productId: string; monthlyPriceId: string; yearlyPriceId: string }>;
}

async function setupStripePricingComplete(): Promise<SetupResult> {
  console.log('🚀 Configuration complète des produits et prix Stripe pour Luneo\n');
  console.log('=' .repeat(60));

  const results: SetupResult = {
    plans: {},
    addOns: {},
  };

  // ==========================================
  // 1. CRÉER LES PLANS DE BASE
  // ==========================================
  console.log('\n📦 ÉTAPE 1: Création des plans de base\n');

  for (const plan of PLANS) {
    console.log(`\n📋 Plan: ${plan.name} (${plan.id})`);

    try {
      // Créer le produit
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          type: 'subscription_plan',
          features: JSON.stringify(plan.features),
        },
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      let monthlyPriceId: string | null = null;
      let yearlyPriceId: string | null = null;

      // Créer le prix mensuel (si pas gratuit)
      if (plan.priceMonthly > 0) {
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
            type: 'subscription_plan',
          },
        });

        monthlyPriceId = monthlyPrice.id;
        console.log(`   ✅ Prix mensuel créé: ${monthlyPrice.id} (${plan.priceMonthly / 100}€/mois)`);
      } else {
        console.log(`   ⚠️  Plan gratuit - pas de prix mensuel`);
      }

      // Créer le prix annuel (si pas gratuit)
      if (plan.priceYearly > 0) {
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
            type: 'subscription_plan',
          },
        });

        yearlyPriceId = yearlyPrice.id;
        console.log(`   ✅ Prix annuel créé: ${yearlyPrice.id} (${plan.priceYearly / 100}€/an)`);
      } else {
        console.log(`   ⚠️  Plan gratuit - pas de prix annuel`);
      }

      results.plans[plan.id] = {
        productId: product.id,
        monthlyPriceId,
        yearlyPriceId,
      };
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
      if (error.code) {
        console.error(`   Code Stripe: ${error.code}`);
      }
    }
  }

  // ==========================================
  // 2. CRÉER LES ADD-ONS
  // ==========================================
  console.log('\n\n🎁 ÉTAPE 2: Création des add-ons\n');

  for (const addon of ADDONS) {
    console.log(`\n🎁 Add-on: ${addon.name} (${addon.id})`);

    try {
      // Créer le produit add-on
      const product = await stripe.products.create({
        name: addon.name,
        description: addon.description,
        metadata: {
          addon_id: addon.id,
          type: 'addon',
          unit_label: addon.unitLabel,
        },
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      // Créer le prix mensuel
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.priceMonthly,
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
        nickname: `${addon.id}-monthly`,
        metadata: {
          addon_id: addon.id,
          billing_cycle: 'monthly',
          type: 'addon',
        },
      });

      console.log(`   ✅ Prix mensuel créé: ${monthlyPrice.id} (${addon.priceMonthly / 100}€/mois)`);

      // Créer le prix annuel
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.priceYearly,
        currency: 'eur',
        recurring: {
          interval: 'year',
        },
        nickname: `${addon.id}-yearly`,
        metadata: {
          addon_id: addon.id,
          billing_cycle: 'yearly',
          type: 'addon',
        },
      });

      console.log(`   ✅ Prix annuel créé: ${yearlyPrice.id} (${addon.priceYearly / 100}€/an)`);

      results.addOns[addon.id] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
      };
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}`);
      if (error.code) {
        console.error(`   Code Stripe: ${error.code}`);
      }
    }
  }

  // ==========================================
  // 3. AFFICHER LE RÉSUMÉ
  // ==========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ - Variables d\'environnement à configurer');
  console.log('='.repeat(60) + '\n');

  console.log('# ==========================================');
  console.log('# PLANS DE BASE');
  console.log('# ==========================================\n');

  for (const [planId, config] of Object.entries(results.plans)) {
    const planUpper = planId.toUpperCase();
    console.log(`# ${planId.charAt(0).toUpperCase() + planId.slice(1)}`);
    console.log(`STRIPE_PRODUCT_${planUpper}=${config.productId}`);
    if (config.monthlyPriceId) {
      console.log(`STRIPE_PRICE_${planUpper}_MONTHLY=${config.monthlyPriceId}`);
    }
    if (config.yearlyPriceId) {
      console.log(`STRIPE_PRICE_${planUpper}_YEARLY=${config.yearlyPriceId}`);
    }
    console.log('');
  }

  console.log('# ==========================================');
  console.log('# ADD-ONS');
  console.log('# ==========================================\n');

  for (const [addonId, config] of Object.entries(results.addOns)) {
    const addonUpper = addonId.toUpperCase().replace(/-/g, '_');
    console.log(`# ${addonId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_PRODUCT_ID=${config.productId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_MONTHLY=${config.monthlyPriceId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_YEARLY=${config.yearlyPriceId}`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✅ Configuration terminée !');
  console.log('='.repeat(60) + '\n');

  console.log('📝 Prochaines étapes:');
  console.log('1. Copiez les variables ci-dessus');
  console.log('2. Ajoutez-les dans Vercel: Settings > Environment Variables');
  console.log('3. Ou ajoutez-les dans .env.local pour le développement');
  console.log('4. Redéployez l\'application\n');

  console.log('⚠️  Note importante:');
  console.log('- Pour un environnement de test, utilisez des clés sk_test_...');
  console.log('- Pour la production, utilisez des clés sk_live_...');
  console.log('- Les Price IDs sont différents entre test et production\n');

  return results;
}

// Exécuter le script
if (require.main === module) {
  setupStripePricingComplete()
    .then(() => {
      console.log('✨ Script terminé avec succès\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution du script:', error);
      process.exit(1);
    });
}

export { setupStripePricingComplete };
