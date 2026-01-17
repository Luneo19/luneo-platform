/**
 * Création directe des produits Stripe en PRODUCTION
 * Utilise directement l'API avec la clé hardcodée
 */

import Stripe from 'stripe';

// Clé de production trouvée
const STRIPE_SECRET_KEY = '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';

console.log(`✅ Utilisation de la clé: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
console.log('');

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion,
});

const PLANS = [
  { id: 'starter', name: 'Luneo Starter', description: 'Parfait pour découvrir Luneo', priceMonthly: 0, priceYearly: 0 },
  { id: 'professional', name: 'Luneo Professional', description: 'Pour les créateurs et PME', priceMonthly: 2900, priceYearly: 27840 },
  { id: 'business', name: 'Luneo Business', description: 'Pour les équipes qui ont besoin de collaboration', priceMonthly: 9900, priceYearly: 95040 },
];

const ADDONS = [
  { id: 'extra-designs', name: 'Designs supplémentaires', description: 'Pack de 100 designs supplémentaires par mois', priceMonthly: 2000, priceYearly: 19200 },
  { id: 'extra-storage', name: 'Stockage supplémentaire', description: '100 GB de stockage supplémentaire', priceMonthly: 500, priceYearly: 4800 },
  { id: 'extra-team-members', name: 'Membres d\'équipe supplémentaires', description: '10 membres d\'équipe supplémentaires', priceMonthly: 1000, priceYearly: 9600 },
  { id: 'extra-api-calls', name: 'API calls supplémentaires', description: 'Pack de 50,000 appels API supplémentaires par mois', priceMonthly: 1500, priceYearly: 14400 },
  { id: 'extra-renders-3d', name: 'Rendus 3D supplémentaires', description: 'Pack de 50 rendus 3D supplémentaires par mois', priceMonthly: 2500, priceYearly: 24000 },
];

async function main() {
  console.log('🚀 Création des produits Stripe en PRODUCTION\n');
  console.log('='.repeat(60));
  
  const results: any = { plans: {}, addOns: {} };

  // Test de la clé d'abord
  try {
    await stripe.products.list({ limit: 1 });
    console.log('✅ Clé Stripe valide\n');
  } catch (error: any) {
    console.error('❌ Clé Stripe invalide:', error.message);
    console.error('⚠️  La clé doit être valide et non révoquée');
    process.exit(1);
  }

  // Créer les plans
  console.log('📦 Création des plans de base\n');
  
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
          metadata: { plan_id: plan.id, billing_cycle: 'monthly', environment: 'production' },
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
          metadata: { plan_id: plan.id, billing_cycle: 'yearly', environment: 'production' },
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
        metadata: { addon_id: addon.id, billing_cycle: 'monthly', environment: 'production' },
      });
      console.log(`   ✅ Prix mensuel: ${monthlyPrice.id} (${addon.priceMonthly / 100}€/mois)`);
      
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.priceYearly,
        currency: 'eur',
        recurring: { interval: 'year' },
        nickname: `${addon.id}-yearly`,
        metadata: { addon_id: addon.id, billing_cycle: 'yearly', environment: 'production' },
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
  
  for (const [planId, config] of Object.entries(results.plans)) {
    const planUpper = planId.toUpperCase();
    console.log(`# ${planId}`);
    console.log(`STRIPE_PRODUCT_${planUpper}=${(config as any).productId}`);
    if ((config as any).monthlyPriceId) console.log(`STRIPE_PRICE_${planUpper}_MONTHLY=${(config as any).monthlyPriceId}`);
    if ((config as any).yearlyPriceId) console.log(`STRIPE_PRICE_${planUpper}_YEARLY=${(config as any).yearlyPriceId}`);
    console.log('');
  }
  
  for (const [addonId, config] of Object.entries(results.addOns)) {
    const addonUpper = addonId.toUpperCase().replace(/-/g, '_');
    console.log(`# ${addonId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_PRODUCT_ID=${(config as any).productId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_MONTHLY=${(config as any).monthlyPriceId}`);
    console.log(`STRIPE_ADDON_${addonUpper}_YEARLY=${(config as any).yearlyPriceId}`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('✅ Produits PRODUCTION créés avec succès !');
  console.log('='.repeat(60));
}

main().catch(console.error);
