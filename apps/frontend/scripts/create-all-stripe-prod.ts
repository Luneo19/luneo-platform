import Stripe from 'stripe';
import { execSync } from 'child_process';

// Obtenir la clé de production
function getLiveKey(): string {
  // 1. Depuis variable d'environnement STRIPE_LIVE_SECRET_KEY
  if (process.env.STRIPE_LIVE_SECRET_KEY && process.env.STRIPE_LIVE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('✅ Utilisation de la clé depuis STRIPE_LIVE_SECRET_KEY');
    return process.env.STRIPE_LIVE_SECRET_KEY;
  }
  
  // 2. Depuis variable d'environnement STRIPE_SECRET_KEY si c'est une clé live
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('✅ Utilisation de la clé depuis STRIPE_SECRET_KEY');
    return process.env.STRIPE_SECRET_KEY;
  }
  
  // 3. Depuis Stripe CLI config
  try {
    const configPath = require('os').homedir() + '/.config/stripe/config.toml';
    const fs = require('fs');
    const config = fs.readFileSync(configPath, 'utf-8');
    const match = config.match(/live_mode_api_key\s*=\s*'([^']+)'/);
    if (match && match[1] && match[1].startsWith('sk_live_')) {
      console.log('✅ Utilisation de la clé depuis Stripe CLI config');
      return match[1];
    }
  } catch (e) {}
  
  throw new Error('Aucune clé Stripe de PRODUCTION valide trouvée. Utilisez STRIPE_LIVE_SECRET_KEY="sk_live_..."');
}

const STRIPE_KEY = getLiveKey();
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion });

const PLANS = [
  { id: 'professional', name: 'Luneo Professional', desc: 'Pour les créateurs et PME', monthly: 2900, yearly: 27840 },
  { id: 'business', name: 'Luneo Business', desc: 'Pour les équipes', monthly: 9900, yearly: 95040 },
];

const ADDONS = [
  { id: 'extra-designs', name: 'Designs supplémentaires', desc: 'Pack de 100 designs', monthly: 2000, yearly: 19200 },
  { id: 'extra-storage', name: 'Stockage supplémentaire', desc: '100 GB', monthly: 500, yearly: 4800 },
  { id: 'extra-team-members', name: 'Membres d\'équipe supplémentaires', desc: '10 membres', monthly: 1000, yearly: 9600 },
  { id: 'extra-api-calls', name: 'API calls supplémentaires', desc: '50K appels', monthly: 1500, yearly: 14400 },
  { id: 'extra-renders-3d', name: 'Rendus 3D supplémentaires', desc: '50 rendus', monthly: 2500, yearly: 24000 },
];

async function main() {
  console.log('🚀 Création produits Stripe PRODUCTION\n');
  
  // Test de la clé
  try {
    const test = await stripe.products.list({ limit: 1 });
    console.log(`✅ Clé valide ! Mode: ${test.livemode ? 'PRODUCTION ✅' : 'TEST ⚠️'}\n`);
  } catch (e: any) {
    console.error('❌ Erreur clé:', e.message);
    if (e.code === 'api_key_expired') {
      console.error('\n⚠️  La clé est EXPIRÉE. Obtenez une nouvelle clé depuis:');
      console.error('   https://dashboard.stripe.com/apikeys (mode LIVE)\n');
    }
    process.exit(1);
  }

  const results: any = { plans: {}, addOns: {} };

  // Plans
  for (const plan of PLANS) {
    try {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.desc,
        metadata: { plan_id: plan.id, environment: 'production' },
      });
      
      const monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly,
        currency: 'eur',
        recurring: { interval: 'month' },
        nickname: `${plan.id}-monthly`,
      });
      
      const yearly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearly,
        currency: 'eur',
        recurring: { interval: 'year' },
        nickname: `${plan.id}-yearly`,
      });
      
      console.log(`✅ ${plan.name}: ${product.id}`);
      console.log(`   Mensuel: ${monthly.id} (${plan.monthly/100}€)`);
      console.log(`   Annuel: ${yearly.id} (${plan.yearly/100}€)\n`);
      
      results.plans[plan.id] = { productId: product.id, monthly: monthly.id, yearly: yearly.id };
    } catch (e: any) {
      console.error(`❌ Erreur ${plan.name}:`, e.message);
    }
  }

  // Add-ons
  for (const addon of ADDONS) {
    try {
      const product = await stripe.products.create({
        name: addon.name,
        description: addon.desc,
        metadata: { addon_id: addon.id, environment: 'production' },
      });
      
      const monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.monthly,
        currency: 'eur',
        recurring: { interval: 'month' },
        nickname: `${addon.id}-monthly`,
      });
      
      const yearly = await stripe.prices.create({
        product: product.id,
        unit_amount: addon.yearly,
        currency: 'eur',
        recurring: { interval: 'year' },
        nickname: `${addon.id}-yearly`,
      });
      
      console.log(`✅ ${addon.name}: ${product.id}`);
      console.log(`   Mensuel: ${monthly.id}`);
      console.log(`   Annuel: ${yearly.id}\n`);
      
      results.addOns[addon.id] = { productId: product.id, monthly: monthly.id, yearly: yearly.id };
    } catch (e: any) {
      console.error(`❌ Erreur ${addon.name}:`, e.message);
    }
  }

  // Résumé
  console.log('='.repeat(60));
  console.log('📋 Variables PRODUCTION');
  console.log('='.repeat(60) + '\n');
  
  for (const [planId, config] of Object.entries(results.plans)) {
    const up = planId.toUpperCase();
    console.log(`STRIPE_PRODUCT_${up}=${(config as any).productId}`);
    console.log(`STRIPE_PRICE_${up}_MONTHLY=${(config as any).monthly}`);
    console.log(`STRIPE_PRICE_${up}_YEARLY=${(config as any).yearly}`);
    console.log('');
  }
  
  for (const [addonId, config] of Object.entries(results.addOns)) {
    const up = addonId.toUpperCase().replace(/-/g, '_');
    console.log(`STRIPE_ADDON_${up}_PRODUCT_ID=${(config as any).productId}`);
    console.log(`STRIPE_ADDON_${up}_MONTHLY=${(config as any).monthly}`);
    console.log(`STRIPE_ADDON_${up}_YEARLY=${(config as any).yearly}`);
    console.log('');
  }
}

main().catch(console.error);
