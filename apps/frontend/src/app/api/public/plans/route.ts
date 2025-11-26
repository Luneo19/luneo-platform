import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Plans par défaut si Stripe n'est pas configuré
const DEFAULT_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour démarrer',
    price: { monthly: 29, yearly: 290 },
    currency: 'EUR',
    features: [
      { name: '100 designs/mois', included: true },
      { name: 'Customizer 2D', included: true },
      { name: 'Export PNG/PDF', included: true },
      { name: 'Support email', included: true },
      { name: 'Configurateur 3D', included: false },
      { name: 'Virtual Try-On', included: false },
      { name: 'API access', included: false },
      { name: 'White-label', included: false },
    ],
    limits: {
      designs: 100,
      products: 50,
      storage: '5 GB',
      apiCalls: 0,
    },
    popular: false,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les équipes en croissance',
    price: { monthly: 79, yearly: 790 },
    currency: 'EUR',
    features: [
      { name: '1000 designs/mois', included: true },
      { name: 'Customizer 2D', included: true },
      { name: 'Configurateur 3D', included: true },
      { name: 'Export tous formats', included: true },
      { name: 'Virtual Try-On', included: true },
      { name: 'API access', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Analytics avancées', included: true },
      { name: 'White-label', included: false },
    ],
    limits: {
      designs: 1000,
      products: 500,
      storage: '50 GB',
      apiCalls: 10000,
    },
    popular: true,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solutions sur-mesure',
    price: { monthly: null, yearly: null }, // Prix sur devis
    currency: 'EUR',
    features: [
      { name: 'Designs illimités', included: true },
      { name: 'Toutes les fonctionnalités', included: true },
      { name: 'White-label complet', included: true },
      { name: 'API illimitée', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'SLA 99.99%', included: true },
      { name: 'Account manager dédié', included: true },
      { name: 'Formation équipe', included: true },
      { name: 'Intégrations custom', included: true },
    ],
    limits: {
      designs: -1, // Illimité
      products: -1,
      storage: 'Illimité',
      apiCalls: -1,
    },
    popular: false,
    stripePriceId: null,
  },
];

/**
 * GET /api/public/plans
 * Récupère les plans de pricing (depuis Stripe si configuré, sinon defaults)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'EUR';
    const interval = searchParams.get('interval') || 'monthly';

    let plans = DEFAULT_PLANS;

    // Si Stripe est configuré, récupérer les prix réels
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Récupérer tous les produits actifs
        const products = await stripe.products.list({
          active: true,
          expand: ['data.default_price'],
        });

        // Récupérer tous les prix
        const prices = await stripe.prices.list({
          active: true,
          currency: currency.toLowerCase(),
        });

        // Mapper les produits Stripe aux plans
        const stripePlans = products.data
          .filter((product: any) => product.metadata?.plan_type)
          .map((product: any) => {
            const productPrices = prices.data.filter(
              (price: any) => price.product === product.id
            );

            const monthlyPrice = productPrices.find(
              (p: any) => p.recurring?.interval === 'month'
            );
            const yearlyPrice = productPrices.find(
              (p: any) => p.recurring?.interval === 'year'
            );

            const features = product.metadata?.features
              ? JSON.parse(product.metadata.features)
              : [];

            const limits = product.metadata?.limits
              ? JSON.parse(product.metadata.limits)
              : {};

            return {
              id: product.metadata?.plan_type || product.id,
              name: product.name,
              description: product.description,
              price: {
                monthly: monthlyPrice ? monthlyPrice.unit_amount / 100 : null,
                yearly: yearlyPrice ? yearlyPrice.unit_amount / 100 : null,
              },
              currency: currency.toUpperCase(),
              features,
              limits,
              popular: product.metadata?.popular === 'true',
              stripePriceId: {
                monthly: monthlyPrice?.id,
                yearly: yearlyPrice?.id,
              },
            };
          })
          .sort((a: any, b: any) => {
            const order = ['starter', 'pro', 'enterprise'];
            return order.indexOf(a.id) - order.indexOf(b.id);
          });

        if (stripePlans.length > 0) {
          plans = stripePlans;
        }
      } catch (stripeError) {
        logger.error('Stripe plans fetch error', { error: stripeError });
        // Fallback aux plans par défaut
      }
    }

    // Cache headers
    const response = NextResponse.json({
      success: true,
      data: {
        plans,
        currency,
        interval,
        stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return response;
  } catch (error) {
    logger.error('Error fetching plans', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des plans' },
      { status: 500 }
    );
  }
}

