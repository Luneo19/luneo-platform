'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  MessageCircle,
  Star,
  Zap,
  X,
  Sparkles,
  Crown,
  Rocket,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  PLAN_CATALOG,
  PLAN_DEFINITIONS,
  type PlanTier,
} from '@luneo/billing-plans';
import { logger } from '@/lib/logger';

const formatPrice = (value: number) =>
  value % 1 === 0
    ? value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type PricingFeature = {
  name: string;
  included: boolean;
};

type PricingQuota = {
  label: string;
  value: string;
  period: string;
};

type PricingPlanCard = {
  tier: PlanTier;
  name: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  cta: string;
  planId?: string;
  href?: string;
  priceMonthly: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  features: PricingFeature[];
  quotas: PricingQuota[];
  popular?: boolean;
  badge?: string;
};

const YEARLY_DISCOUNT_DEFAULT = 0.2;

const MARKETING_PRESENTATION: Record<
  PlanTier,
  {
    description: string;
    icon: React.ReactNode;
    gradient: string;
    cta: string;
    planId?: string;
    href?: string;
    yearlyDiscount?: number;
    badge?: string;
    popular?: boolean;
    optionalFeatures?: PricingFeature[];
  }
> = {
  starter: {
    description: 'Parfait pour découvrir Luneo',
    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-gray-500 to-gray-600',
    cta: 'Commencer',
    href: '/register',
    yearlyDiscount: 0,
    optionalFeatures: [
      { name: 'Support prioritaire', included: false },
      { name: 'API & intégrations avancées', included: false },
      { name: 'Exports HD/PDF', included: false },
    ],
  },
  professional: {
    description: 'Pour les créateurs professionnels',
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-blue-500 to-purple-600',
    cta: 'Essayer maintenant',
    planId: 'professional',
    badge: 'POPULAIRE',
    popular: true,
    optionalFeatures: [
      { name: 'Support dédié 24/7', included: false },
      { name: 'Formation sur mesure', included: false },
    ],
  },
  business: {
    description: 'Pour les équipes en croissance',
    icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-purple-500 to-pink-600',
    cta: 'Essayer maintenant',
    planId: 'business',
    optionalFeatures: [
      { name: 'Clusters régionaux supplémentaires', included: false },
      { name: 'Support dédié 24/7', included: false },
    ],
  },
  enterprise: {
    description: 'Programmes sur-mesure & multi-division',
    icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-orange-500 to-red-600',
    cta: 'Nous contacter',
    planId: 'enterprise',
    href: '/contact',
    yearlyDiscount: 0,
  },
};

const buildPricingPlans = (): PricingPlanCard[] => {
  return PLAN_CATALOG.availableTiers.map((tier) => {
    const definition = PLAN_DEFINITIONS[tier];
    const marketing = MARKETING_PRESENTATION[tier];
    const monthlyPrice = definition.basePriceCents / 100;
    const yearlyDiscount = marketing.yearlyDiscount ?? YEARLY_DISCOUNT_DEFAULT;
    const yearlyPrice = Math.round(monthlyPrice * 12 * (1 - yearlyDiscount) * 100) / 100;

    const quotas: PricingQuota[] = definition.quotas.map((quota) => ({
      label: quota.label,
      value:
        quota.limit < 0
          ? 'Illimité'
          : `${quota.limit.toLocaleString('fr-FR')} ${quota.unit === 'seat' ? 'places' : quota.unit}`,
      period:
        quota.period === 'month'
          ? 'par mois'
          : quota.period === 'day'
            ? 'par jour'
            : `par ${quota.period}`,
    }));

    const features: PricingFeature[] = [
      ...definition.features.map((feature) => ({
        name: feature.label,
        included: feature.enabled,
      })),
      ...(marketing.optionalFeatures ?? []),
    ];

    return {
      tier,
      name: definition.name,
      icon: marketing.icon,
      description: marketing.description,
      gradient: marketing.gradient,
      cta: marketing.cta,
      planId: marketing.planId,
      href: marketing.href,
      priceMonthly: monthlyPrice,
      yearlyPrice: yearlyPrice,
      yearlyDiscount,
      features,
      quotas,
      popular: marketing.popular,
      badge: marketing.badge,
    };
  });
};

const plans = buildPricingPlans();

const faqs = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et la facturation est ajustée au prorata."
  },
  {
    question: "Acceptez-vous les paiements par virement bancaire ?",
    answer: "Oui, pour les plans Business et Enterprise, nous acceptons les virements bancaires avec facturation mensuelle ou annuelle. Contactez-nous pour plus d'informations."
  },
  {
    question: "Y a-t-il une période d'essai gratuite ?",
    answer: "Oui, tous les plans payants bénéficient d'une période d'essai de 14 jours, sans engagement et sans carte bancaire requise pour démarrer."
  },
  {
    question: "Que se passe-t-il si je dépasse ma limite mensuelle ?",
    answer: "Nous vous préviendrons lorsque vous approchez de votre limite. Vous pouvez soit upgrader votre plan, soit attendre le renouvellement mensuel. Aucun frais supplémentaire n'est appliqué."
  },
  {
    question: "Proposez-vous des réductions pour les associations ?",
    answer: "Oui, nous offrons des réductions allant jusqu'à 50% pour les associations à but non lucratif, les établissements d'enseignement et les startups en phase d'amorçage. Contactez notre équipe commerciale."
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Oui, vous pouvez annuler votre abonnement à tout moment sans frais. Vous conserverez l'accès jusqu'à la fin de votre période de facturation en cours."
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string, isYearly: boolean) => {
    if (!planId) {
      logger.error('PlanId manquant', { planId, isYearly });
      return;
    }

    // Empêcher les clics multiples
    if (loading === planId) {
      logger.debug('Checkout déjà en cours', { planId });
      return;
    }

    setLoading(planId);
    
    try {
      // Récupérer l'email de l'utilisateur si connecté
      let userEmail: string | undefined;
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email;
      } catch (e) {
        // Si l'utilisateur n'est pas connecté, email sera undefined (optionnel)
        logger.debug('Utilisateur non connecté, email optionnel', { planId });
      }

      logger.info('Création session checkout', { planId, billing: isYearly ? 'yearly' : 'monthly', userEmail });

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billing: isYearly ? 'yearly' : 'monthly',
          ...(userEmail && { email: userEmail }),
        }),
      });

      logger.debug('Réponse API checkout', { status: response.status, ok: response.ok, planId });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Erreur API checkout', {
          error: errorData,
          status: response.status,
          planId,
          isYearly,
          message: errorData.error || errorData.message || `Erreur HTTP ${response.status}`,
        });
        throw new Error(errorData.error || errorData.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      logger.debug('Données checkout reçues', { planId, hasUrl: !!data.url });

      // L'API peut retourner soit { success: true, url: ... } soit directement { url: ... }
      const checkoutUrl = data.url || (data.success && data.url);
      
      if (checkoutUrl) {
        logger.info('Redirection vers checkout', { planId, checkoutUrl: checkoutUrl.substring(0, 50) + '...' });
        // Réinitialiser le loading avant la redirection
        setLoading(null);
        // Petite pause pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 100);
      } else {
        // Si pas d'URL mais success: false, afficher l'erreur
        if (data.success === false) {
          throw new Error(data.error || 'Échec de la création de la session');
        }
        throw new Error('URL de checkout non reçue dans la réponse');
      }
    } catch (error: any) {
      logger.error('Erreur checkout complète', {
        error,
        planId,
        isYearly,
        message: error.message || 'Unknown error',
      });
      // Toujours réinitialiser le loading en cas d'erreur
      setLoading(null);
      
      // Afficher un message d'erreur plus informatif
      const errorMessage = error.message || 'Erreur lors de la création de la session de paiement. Veuillez réessayer.';
      alert(`Erreur: ${errorMessage}\n\nSi le problème persiste, contactez le support.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900/50">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 sm:grid-cols-12 grid-rows-6 h-full w-full">
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-500/20 animate-pulse"
                  style={{
                    animationDelay: `${(i * 0.1) % 3}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2 fill-current" />
              -20% sur les plans annuels
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Des tarifs{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                transparents
              </span>
              <br className="hidden sm:block" />
              pour toutes les équipes
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
              <br className="hidden md:block" />
              <span className="text-blue-400 font-semibold">
                Essai gratuit de 14 jours. Sans carte bancaire.
              </span>
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-800/80 backdrop-blur-sm p-2 rounded-xl border border-gray-700">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annuel
                <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative"
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="inline-flex items-center px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                      <Crown className="w-4 h-4 mr-1" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <Card
                  className={`h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 p-4 sm:p-6 md:p-8 hover:bg-gray-800/70 transition-all ${
                    plan.popular ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/20' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${plan.gradient} text-white mb-4`}>
                    {plan.icon}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-bold text-white">
                        {formatPrice(
                          billingPeriod === 'yearly'
                            ? Math.round(plan.yearlyPrice / 12)
                            : plan.priceMonthly,
                        )}
                        €
                      </span>
                      <span className="text-gray-400 ml-2">/mois</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-gray-400">
                          {formatPrice(plan.yearlyPrice)}€ facturé annuellement
                        </div>
                        <div className="text-xs text-green-400 font-semibold">
                          Économisez {formatPrice(plan.priceMonthly * 12 - plan.yearlyPrice)}€/an
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {plan.href ? (
                    <Link href={plan.href} className="block mb-6">
                      <Button
                        className={`w-full h-12 font-semibold ${
                          plan.popular
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-gray-600'
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : plan.planId ? (
                    <Button
                      onClick={() => handleCheckout(plan.planId!, billingPeriod === 'yearly')}
                      disabled={loading === plan.planId}
                      className={`w-full h-12 font-semibold mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-gray-600'
                      }`}
                    >
                      {loading === plan.planId ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Chargement...
                        </div>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  ) : null}

                  {/* Features */}
                  <div className="space-y-3 border-t border-gray-700 pt-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs sm:text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-gray-700 pt-5 space-y-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Quotas clés
                    </p>
                    {plan.quotas.slice(0, 4).map((quota, index) => (
                      <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-300">{quota.label}</span>
                        <span className="text-gray-400">
                          {quota.value} <span className="text-gray-500">{quota.period}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Comparaison détaillée des plans
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Toutes les fonctionnalités en un coup d'œil
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-xl">
              <thead className="bg-gray-800/50">
                <tr>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-left text-sm font-bold text-white">
                    Fonctionnalités
                  </th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-center text-sm font-bold text-white">
                    Starter
                  </th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-center text-sm font-bold text-white bg-blue-900/20">
                    <div className="flex items-center justify-center gap-2">
                      <span>Professional</span>
                      <Crown className="w-4 h-4 text-blue-400" />
                    </div>
                  </th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-center text-sm font-bold text-white">
                    Business
                  </th>
                  <th scope="col" className="py-4 px-4 sm:px-6 text-center text-sm font-bold text-white">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800/30">
                {/* Pricing */}
                <tr className="bg-gray-800/50">
                  <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-white">Prix mensuel</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-white font-bold">Gratuit</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-white font-bold bg-blue-900/10">29€</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-white font-bold">59€</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-white font-bold">99€</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-white">Prix annuel</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-gray-400">-</td>
                  <td className="py-4 px-4 sm:px-6 text-center bg-blue-900/10">
                    <div className="text-white font-bold">278.4€/an</div>
                    <div className="text-xs text-green-400">23.20€/mois</div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <div className="text-white font-bold">566.4€/an</div>
                    <div className="text-xs text-green-400">47.20€/mois</div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <div className="text-white font-bold">950.4€/an</div>
                    <div className="text-xs text-green-400">79.20€/mois</div>
                  </td>
                </tr>

                {/* Additional rows would go here - abbreviated for space */}
                <tr className="bg-gray-800/50">
                  <td colSpan={5} className="py-3 px-4 sm:px-6 text-sm font-bold text-blue-400">
                    Création de designs
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 text-sm text-gray-300">Designs par mois</td>
                  <td className="py-3 px-4 sm:px-6 text-center text-gray-400">10</td>
                  <td className="py-3 px-4 sm:px-6 text-center text-white bg-blue-900/10">100</td>
                  <td className="py-3 px-4 sm:px-6 text-center text-white">500</td>
                  <td className="py-3 px-4 sm:px-6 text-center text-white">Illimité</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Questions fréquentes
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Tout ce que vous devez savoir sur nos tarifs et notre facturation
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 hover:bg-gray-800/70 transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Prêt à transformer votre workflow créatif ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10">
              Rejoignez 10 000+ créateurs qui utilisent Luneo chaque jour
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/register">
                <Button className="w-full sm:w-auto px-6 sm:px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold shadow-2xl">
                  Essai gratuit 14 jours
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="w-full sm:w-auto px-6 sm:px-8 py-6 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold border border-gray-600">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Parler à un expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison vs Zakeke Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Comparaison Objective</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Luneo vs Zakeke
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Pourquoi Luneo est techniquement et commercialement supérieur
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-blue-500/20 p-6 sm:p-8 overflow-x-auto">
            <div className="min-w-[700px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                    <th className="pb-4 text-gray-400 font-semibold">Zakeke</th>
                    <th className="pb-4 text-blue-400 font-semibold">Luneo</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-800">
                    <td colSpan={3} className="py-3 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      VIRTUAL TRY-ON
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Tracking</td>
                    <td className="py-4 text-gray-400">AI basique</td>
                    <td className="py-4 text-white font-semibold">✅ MediaPipe 468+21</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Vues/mois</td>
                    <td className="py-4 text-gray-400">500-5000</td>
                    <td className="py-4 text-white font-semibold">✅ Illimité</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Prix Pro</td>
                    <td className="py-4 text-gray-400">126€/mois (~120$ USD)</td>
                    <td className="py-4 text-white font-semibold">✅ 29€/mois (Professional)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td colSpan={3} className="py-3 text-blue-400 font-bold text-xs uppercase tracking-wider pt-4">
                      3D CONFIGURATOR
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Gravure 3D</td>
                    <td className="py-4 text-gray-400">Non</td>
                    <td className="py-4 text-white font-semibold">✅ Extrusion 3D</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Export</td>
                    <td className="py-4 text-gray-400">GLB</td>
                    <td className="py-4 text-white font-semibold">✅ GLB+USDZ+FBX+Print</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td colSpan={3} className="py-3 text-purple-400 font-bold text-xs uppercase tracking-wider pt-4">
                      CUSTOMIZER
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 text-gray-300">Collaboration</td>
                    <td className="py-4 text-gray-400">Non</td>
                    <td className="py-4 text-white font-semibold">✅ Real-time</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-gray-300">Print Export</td>
                    <td className="py-4 text-gray-400">PDF basique</td>
                    <td className="py-4 text-white font-semibold">✅ PDF/X-4 + CMYK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/30 p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">-77%</div>
              <p className="text-sm text-white font-semibold mb-1">Prix Plus Bas</p>
              <p className="text-xs text-gray-400">29€ vs 126€/mois</p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">+15</div>
              <p className="text-sm text-white font-semibold mb-1">Features Uniques</p>
              <p className="text-xs text-gray-400">Gravure, Collab, Versioning...</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">∞</div>
              <p className="text-sm text-white font-semibold mb-1">Vues Illimitées</p>
              <p className="text-xs text-gray-400">vs 500-5000/mois</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
