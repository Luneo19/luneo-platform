import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Plans Luneo - Tarification 2025
const DEFAULT_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour découvrir Luneo et tester toutes les fonctionnalités de base',
    price: { monthly: 29, yearly: 278.40 }, // -20% annuel
    currency: 'EUR',
    features: [
      { name: '50 designs/mois', included: true },
      { name: 'Customizer 2D', included: true },
      { name: '100 rendus 2D/mois', included: true },
      { name: '10 rendus 3D/mois', included: true },
      { name: 'Export PNG/PDF', included: true },
      { name: 'Support standard', included: true },
      { name: '3 membres d\'équipe', included: true },
      { name: '5 GB stockage', included: true },
      { name: 'API access', included: false },
      { name: 'Branding personnalisé', included: false },
    ],
    limits: {
      designs: 50,
      products: 50,
      storage: '5 GB',
      apiCalls: 10000,
      teamMembers: 3,
    },
    popular: false,
    stripePriceId: null, // Starter est gratuit
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    price: { monthly: 49, yearly: 470.40 }, // -20% annuel
    currency: 'EUR',
    features: [
      { name: '250 designs/mois', included: true },
      { name: 'Customizer 2D', included: true },
      { name: 'Configurateur 3D', included: true },
      { name: '500 rendus 2D/mois', included: true },
      { name: '50 rendus 3D/mois', included: true },
      { name: 'Export tous formats', included: true },
      { name: 'Virtual Try-On', included: true },
      { name: 'API access', included: true },
      { name: 'Support prioritaire', included: true },
      { name: '10 membres d\'équipe', included: true },
      { name: '50 GB stockage', included: true },
      { name: 'Branding personnalisé', included: true },
      { name: 'Webhooks temps réel', included: true },
    ],
    limits: {
      designs: 250,
      products: 250,
      storage: '50 GB',
      apiCalls: 100000,
      teamMembers: 10,
    },
    popular: true,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1SqLIkKG9MsM6fdSt59Vg3F1',
      yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_1SqLIlKG9MsM6fdSDh9Xya8V',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    price: { monthly: 99, yearly: 950.40 }, // -20% annuel
    currency: 'EUR',
    features: [
      { name: '1000 designs/mois', included: true },
      { name: 'Toutes les fonctionnalités Pro', included: true },
      { name: '2000 rendus 2D/mois', included: true },
      { name: '200 rendus 3D/mois', included: true },
      { name: 'White-label complet', included: true },
      { name: 'API & SDKs', included: true },
      { name: 'Support dédié', included: true },
      { name: '50 membres d\'équipe', included: true },
      { name: '100 GB stockage', included: true },
      { name: 'SLA 99.5%', included: true },
      { name: 'Analytics avancés', included: true },
    ],
    limits: {
      designs: 1000,
      products: 500,
      storage: '100 GB',
      apiCalls: 200000,
      teamMembers: 50,
    },
    popular: false,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_1SqLImKG9MsM6fdS9rmCQyIE',
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_1SqLImKG9MsM6fdSO6ihDDpO',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution sur-mesure pour les grandes organisations et multi-divisions',
    price: { monthly: null, yearly: null }, // Sur demande
    currency: 'EUR',
    features: [
      { name: 'Designs illimités', included: true },
      { name: 'Toutes les fonctionnalités Business', included: true },
      { name: 'Rendus illimités', included: true },
      { name: 'Infrastructure dédiée multi-régions', included: true },
      { name: 'White-label complet', included: true },
      { name: 'API illimitée', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'SLA 99.99%', included: true },
      { name: 'Support white-glove 24/7', included: true },
      { name: 'Account manager dédié', included: true },
      { name: 'Formation équipe', included: true },
      { name: 'Intégrations custom', included: true },
      { name: 'Compliance avancée & audits', included: true },
    ],
    limits: {
      designs: -1, // Illimité
      products: -1,
      storage: 'Illimité',
      apiCalls: -1,
      teamMembers: -1,
    },
    popular: false,
    stripePriceId: null, // Sur demande
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
            const order = ['starter', 'professional', 'business', 'enterprise'];
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

