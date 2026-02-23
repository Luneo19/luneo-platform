import { NextRequest, NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger-server';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Découvrez Luneo gratuitement',
    price: { monthly: 0, yearly: 0 },
    currency: 'EUR',
    features: [
      { name: '1 agent IA', included: true },
      { name: '100 conversations/mois', included: true },
      { name: '1 base de connaissances', included: true },
      { name: 'Widget chat', included: true },
      { name: 'Support communautaire', included: true },
      { name: '1 membre', included: true },
      { name: '500 Mo de stockage', included: true },
      { name: 'API access', included: false },
      { name: 'Visual Builder', included: false },
      { name: 'Canal email', included: false },
    ],
    limits: {
      agents: 1, conversations: 100, knowledgeBases: 1, documents: 10,
      storage: '500 Mo', apiCalls: 0, teamMembers: 1,
    },
    popular: false,
    stripePriceId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les équipes qui scalent avec les agents IA',
    price: { monthly: 49, yearly: 468 },
    currency: 'EUR',
    features: [
      { name: '5 agents IA', included: true },
      { name: '2 000 conversations/mois', included: true },
      { name: '5 bases de connaissances', included: true },
      { name: 'Visual Builder', included: true },
      { name: 'Canal email', included: true },
      { name: 'API access', included: true },
      { name: 'Support prioritaire', included: true },
      { name: '5 membres d\'équipe', included: true },
      { name: '10 Go de stockage', included: true },
    ],
    limits: {
      agents: 5, conversations: 2000, knowledgeBases: 5, documents: 200,
      storage: '10 Go', apiCalls: 50000, teamMembers: 5,
    },
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ? {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    } : null,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les entreprises avec des besoins avancés',
    price: { monthly: 149, yearly: 1428 },
    currency: 'EUR',
    features: [
      { name: '25 agents IA', included: true },
      { name: '15 000 conversations/mois', included: true },
      { name: '25 bases de connaissances', included: true },
      { name: 'Toutes les fonctionnalités Pro', included: true },
      { name: 'White-label complet', included: true },
      { name: 'Analytics avancés', included: true },
      { name: 'Support dédié', included: true },
      { name: '25 membres d\'équipe', included: true },
      { name: '100 Go de stockage', included: true },
      { name: 'SLA 99.5 %', included: true },
    ],
    limits: {
      agents: 25, conversations: 15000, knowledgeBases: 25, documents: 1000,
      storage: '100 Go', apiCalls: 200000, teamMembers: 25,
    },
    popular: false,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ? {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || null,
    } : null,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution sur mesure pour les grandes organisations',
    price: { monthly: null, yearly: null },
    currency: 'EUR',
    features: [
      { name: 'Agents illimités', included: true },
      { name: 'Conversations illimitées', included: true },
      { name: 'Toutes les fonctionnalités Business', included: true },
      { name: 'Infrastructure dédiée', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'SLA 99.99 %', included: true },
      { name: 'Support 24/7 dédié', included: true },
      { name: 'Account manager', included: true },
      { name: 'Formation équipe', included: true },
      { name: 'Intégrations personnalisées', included: true },
    ],
    limits: {
      agents: -1, conversations: -1, knowledgeBases: -1, documents: -1,
      storage: 'Illimité', apiCalls: -1, teamMembers: -1,
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
        type StripeProductLike = { id: string; name?: string; description?: string | null; metadata?: { plan_type?: string; features?: string; limits?: string; popular?: string } };
        type StripePriceLike = { product: string; unit_amount: number | null; recurring?: { interval: string }; id?: string };
        const stripePlans = (products.data as StripeProductLike[])
          .filter((product) => product.metadata?.plan_type)
          .map((product) => {
            const productPrices = (prices.data as StripePriceLike[]).filter(
              (price) => price.product === product.id
            );

            const monthlyPrice = productPrices.find(
              (p) => p.recurring?.interval === 'month'
            );
            const yearlyPrice = productPrices.find(
              (p) => p.recurring?.interval === 'year'
            );

            const features = product.metadata?.features
              ? JSON.parse(product.metadata.features)
              : [];

            const limits = product.metadata?.limits
              ? JSON.parse(product.metadata.limits)
              : {};

            return {
              id: product.metadata?.plan_type || product.id,
              name: product.name ?? '',
              description: product.description ?? '',
              price: {
                monthly: monthlyPrice ? (monthlyPrice.unit_amount ?? 0) / 100 : 0,
                yearly: yearlyPrice ? (yearlyPrice.unit_amount ?? 0) / 100 : 0,
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
          .sort((a: { id: string }, b: { id: string }) => {
            const order = ['free', 'pro', 'business', 'enterprise'];
            return order.indexOf(a.id) - order.indexOf(b.id);
          });

        if (stripePlans.length > 0) {
          plans = stripePlans as typeof DEFAULT_PLANS;
        }
      } catch (stripeError) {
        serverLogger.error('Stripe plans fetch error', { error: stripeError });
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
    serverLogger.error('Error fetching plans', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des plans' },
      { status: 500 }
    );
  }
}

