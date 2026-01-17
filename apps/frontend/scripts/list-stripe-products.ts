import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY non configurée');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion,
});

async function listStripeProducts() {
  try {
    console.log('📋 Liste des produits Stripe existants...\n');
    
    const products = await stripe.products.list({ limit: 100 });
    const prices = await stripe.prices.list({ limit: 100 });
    
    console.log(`✅ ${products.data.length} produit(s) trouvé(s)\n`);
    
    for (const product of products.data) {
      console.log(`📦 Produit: ${product.name} (${product.id})`);
      console.log(`   Description: ${product.description || 'N/A'}`);
      console.log(`   Plan ID: ${product.metadata.plan_id || product.metadata.addon_id || 'N/A'}`);
      
      const productPrices = prices.data.filter(p => p.product === product.id);
      for (const price of productPrices) {
        const amount = price.unit_amount ? (price.unit_amount / 100) : 0;
        const interval = price.recurring?.interval || 'once';
        console.log(`   💰 Prix: ${price.id} - ${amount}€/${interval}`);
      }
      console.log('');
    }
    
    console.log('📋 Variables d\'environnement à utiliser:\n');
    console.log('# Plans de base');
    for (const product of products.data.filter(p => p.metadata.plan_id)) {
      const planId = product.metadata.plan_id;
      const productPrices = prices.data.filter(p => p.product === product.id);
      const monthly = productPrices.find(p => p.recurring?.interval === 'month');
      const yearly = productPrices.find(p => p.recurring?.interval === 'year');
      
      console.log(`\n# ${planId}`);
      console.log(`STRIPE_PRODUCT_${planId.toUpperCase()}=${product.id}`);
      if (monthly) console.log(`STRIPE_PRICE_${planId.toUpperCase()}_MONTHLY=${monthly.id}`);
      if (yearly) console.log(`STRIPE_PRICE_${planId.toUpperCase()}_YEARLY=${yearly.id}`);
    }
    
    console.log('\n# Add-ons');
    for (const product of products.data.filter(p => p.metadata.addon_id)) {
      const addonId = product.metadata.addon_id;
      const productPrices = prices.data.filter(p => p.product === product.id);
      const monthly = productPrices.find(p => p.recurring?.interval === 'month');
      const yearly = productPrices.find(p => p.recurring?.interval === 'year');
      
      console.log(`\n# ${addonId}`);
      const addonUpper = addonId.toUpperCase().replace(/-/g, '_');
      console.log(`STRIPE_ADDON_${addonUpper}_PRODUCT_ID=${product.id}`);
      if (monthly) console.log(`STRIPE_ADDON_${addonUpper}_MONTHLY=${monthly.id}`);
      if (yearly) console.log(`STRIPE_ADDON_${addonUpper}_YEARLY=${yearly.id}`);
    }
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Clé API invalide. Vérifiez que votre clé Stripe est correcte.');
      console.error('Pour une clé de test, utilisez: sk_test_...');
      console.error('Pour une clé de production, utilisez: sk_live_...');
    }
    process.exit(1);
  }
}

listStripeProducts();
