import Stripe from 'stripe';
const KEY = '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';
const stripe = new Stripe(KEY, { apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion });

async function main() {
  console.log('🚀 Création produits PRODUCTION avec clé directe\n');
  
  try {
    // Test de la clé
    const test = await stripe.products.list({ limit: 1 });
    console.log(`✅ Clé valide ! Mode: ${test.livemode ? 'PRODUCTION' : 'TEST'}\n`);
  } catch (e: any) {
    console.error('❌ Clé invalide:', e.message);
    process.exit(1);
  }

  // Professional
  const pro = await stripe.products.create({ name: 'Luneo Professional', description: 'Pour les créateurs et PME', metadata: { plan_id: 'professional', environment: 'production' } });
  const proMonthly = await stripe.prices.create({ product: pro.id, unit_amount: 2900, currency: 'eur', recurring: { interval: 'month' }, nickname: 'professional-monthly' });
  const proYearly = await stripe.prices.create({ product: pro.id, unit_amount: 27840, currency: 'eur', recurring: { interval: 'year' }, nickname: 'professional-yearly' });
  console.log(`✅ Professional: ${pro.id}`);
  console.log(`   Monthly: ${proMonthly.id}`);
  console.log(`   Yearly: ${proYearly.id}\n`);

  // Business
  const bus = await stripe.products.create({ name: 'Luneo Business', description: 'Pour les équipes', metadata: { plan_id: 'business', environment: 'production' } });
  const busMonthly = await stripe.prices.create({ product: bus.id, unit_amount: 9900, currency: 'eur', recurring: { interval: 'month' }, nickname: 'business-monthly' });
  const busYearly = await stripe.prices.create({ product: bus.id, unit_amount: 95040, currency: 'eur', recurring: { interval: 'year' }, nickname: 'business-yearly' });
  console.log(`✅ Business: ${bus.id}`);
  console.log(`   Monthly: ${busMonthly.id}`);
  console.log(`   Yearly: ${busYearly.id}\n`);

  console.log('📋 Variables PRODUCTION:');
  console.log(`STRIPE_PRODUCT_PROFESSIONAL=${pro.id}`);
  console.log(`STRIPE_PRICE_PROFESSIONAL_MONTHLY=${proMonthly.id}`);
  console.log(`STRIPE_PRICE_PROFESSIONAL_YEARLY=${proYearly.id}`);
  console.log(`STRIPE_PRODUCT_BUSINESS=${bus.id}`);
  console.log(`STRIPE_PRICE_BUSINESS_MONTHLY=${busMonthly.id}`);
  console.log(`STRIPE_PRICE_BUSINESS_YEARLY=${busYearly.id}`);
}

main().catch(console.error);
