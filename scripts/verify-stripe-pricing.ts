import 'dotenv/config';
import Stripe from 'stripe';
import { PLAN_DEFINITIONS, type PlanTier } from '@luneo/billing-plans';

const REQUIRED_PRICE_ENV: Partial<Record<PlanTier, string | undefined>> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

const EXPECTED_CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY ?? 'eur').toLowerCase();

interface ValidationIssue {
  plan: PlanTier;
  message: string;
}

interface PlanCheckResult {
  plan: PlanTier;
  planLabel: string;
  catalogPrice: number;
  stripePrice?: number | null;
  stripeCurrency?: string;
  stripePriceId?: string;
  status: 'ok' | 'warning' | 'error';
  details: string[];
}

function formatAmount(cents?: number | null) {
  if (cents === undefined || cents === null) {
    return 'n/a';
  }
  return `€${(cents / 100).toFixed(2)}`;
}

async function fetchStripePrice(stripe: Stripe, priceId: string) {
  const price = await stripe.prices.retrieve(priceId, {
    expand: ['product'],
  });

  const unitAmount =
    price.unit_amount ??
    (price.unit_amount_decimal ? Number(price.unit_amount_decimal) : undefined);

  const productName =
    typeof price.product === 'string'
      ? price.product
      : price.product?.name ?? price.product?.id;

  return {
    unitAmount,
    currency: price.currency,
    productName,
    interval: price.recurring?.interval,
  };
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required to verify pricing parity.');
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });

  const issues: ValidationIssue[] = [];
  const results: PlanCheckResult[] = [];

  const planEntries = Object.entries(PLAN_DEFINITIONS) as Array<[PlanTier, typeof PLAN_DEFINITIONS[PlanTier]]>;

  for (const [planId, definition] of planEntries) {
    const envPriceId = REQUIRED_PRICE_ENV[planId];
    const catalogPrice = definition.basePriceCents ?? 0;
    const planLabel = definition.name ?? planId;
    const details: string[] = [];

    if (!envPriceId) {
      if (planId === 'starter') {
        details.push('Aucun price Stripe requis pour le plan starter (plan gratuit).');
        results.push({
          plan: planId,
          planLabel,
          catalogPrice,
          stripePrice: undefined,
          stripeCurrency: undefined,
          stripePriceId: undefined,
          status: 'warning',
          details,
        });
        continue;
      }

      issues.push({
        plan: planId,
        message: `Variable d’environnement manquante pour ${planId} (ex: STRIPE_PRICE_PRO).`,
      });
      results.push({
        plan: planId,
        planLabel,
        catalogPrice,
        stripePrice: undefined,
        stripeCurrency: undefined,
        stripePriceId: undefined,
        status: 'error',
        details,
      });
      continue;
    }

    try {
      const stripePrice = await fetchStripePrice(stripe, envPriceId);
      const planIssues: string[] = [];
      let status: PlanCheckResult['status'] = 'ok';

      if (stripePrice.unitAmount !== catalogPrice) {
        planIssues.push(
          `Mismatch montant (catalogue ${formatAmount(catalogPrice)} vs Stripe ${formatAmount(stripePrice.unitAmount)})`,
        );
      }

      if ((stripePrice.currency ?? '').toLowerCase() !== EXPECTED_CURRENCY) {
        planIssues.push(
          `Devise inattendue (${stripePrice.currency ?? 'inconnue'} au lieu de ${EXPECTED_CURRENCY})`,
        );
      }

      if (stripePrice.interval && stripePrice.interval !== 'month') {
        planIssues.push(`Interval Stripe ${stripePrice.interval} (attendu: month).`);
      }

      if (planIssues.length > 0) {
        status = 'error';
        planIssues.forEach((msg) =>
          issues.push({
            plan: planId,
            message: msg,
          }),
        );
      } else {
        details.push(
          `OK – ${planLabel}: ${formatAmount(catalogPrice)} (${EXPECTED_CURRENCY.toUpperCase()}/month)`,
        );
        if (stripePrice.productName) {
          details.push(`Produit Stripe: ${stripePrice.productName}`);
        }
      }

      results.push({
        plan: planId,
        planLabel,
        catalogPrice,
        stripePrice: stripePrice.unitAmount,
        stripeCurrency: stripePrice.currency,
        stripePriceId: envPriceId,
        status,
        details: planIssues.length ? planIssues : details,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Impossible de récupérer le price ${envPriceId}`;
      issues.push({
        plan: planId,
        message,
      });
      results.push({
        plan: planId,
        planLabel,
        catalogPrice,
        stripePrice: null,
        stripeCurrency: undefined,
        stripePriceId: envPriceId,
        status: 'error',
        details: [message],
      });
    }
  }

  // Output summary table
  console.table(
    results.map((result) => ({
      Plan: result.planLabel,
      'Catalog €': formatAmount(result.catalogPrice),
      'Stripe €': formatAmount(result.stripePrice),
      Currency: result.stripeCurrency ?? 'n/a',
      PriceID: result.stripePriceId ?? 'n/a',
      Status: result.status.toUpperCase(),
    })),
  );

  results.forEach((result) => {
    if (result.details.length > 0) {
      console.log(`\n🧾 ${result.planLabel}:`);
      result.details.forEach((detail) => console.log(`   • ${detail}`));
    }
  });

  if (issues.length > 0) {
    console.error('\n❌ Parité Stripe / catalogue: incohérences détectées:');
    issues.forEach((item) => console.error(` - [${item.plan}] ${item.message}`));
    process.exitCode = 1;
  } else {
    console.log('\n✅ Pricing Stripe aligné avec PLAN_DEFINITIONS.');
  }
}

main().catch((error) => {
  console.error('Erreur durant la vérification Stripe:', error);
  process.exitCode = 1;
});


