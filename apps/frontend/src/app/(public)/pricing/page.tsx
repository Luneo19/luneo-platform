'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Star,
  Zap,
  X,
  Sparkles,
  Crown,
  Rocket,
  Building2,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Calculator,
  TrendingUp,
  Award,
  Lock,
  Globe,
  HeartHandshake,
  BadgeCheck,
  Headphones,
  RefreshCw,
  CreditCard,
  Percent,
  Gift,
  Target,
  BarChart3,
  Infinity as InfinityIcon,
  Phone,
  Loader2,
  AlertCircle,
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
import { usePricingPlans } from '@/lib/hooks/useMarketingData';

// ============================================
// TYPES
// ============================================

type PricingFeature = {
  name: string;
  included: boolean;
  highlight?: boolean;
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
  testimonial?: {
    quote: string;
    author: string;
    company: string;
    avatar: string;
  };
};

type FAQ = {
  question: string;
  answer: string;
  category?: string;
};

type ROIInput = {
  currentDesignTime: number; // heures par semaine
  hourlyRate: number; // €/h
  designsPerMonth: number;
};

// ============================================
// HELPERS
// ============================================

const formatPrice = (value: number) =>
  value % 1 === 0
    ? value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatNumber = (value: number) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

// ============================================
// CONSTANTS
// ============================================

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
    testimonial?: {
      quote: string;
      author: string;
      company: string;
      avatar: string;
    };
  }
> = {
  starter: {
    description: 'Parfait pour découvrir Luneo et tester toutes les fonctionnalités de base',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-slate-500 to-slate-600',
    cta: 'Commencer gratuitement',
    href: '/register',
    yearlyDiscount: 0,
    optionalFeatures: [
      { name: 'Support prioritaire', included: false },
      { name: 'API & intégrations avancées', included: false },
      { name: 'Exports HD/PDF professionnels', included: false },
    ],
    testimonial: {
      quote: "Parfait pour démarrer et comprendre la puissance de l'outil !",
      author: 'Marc D.',
      company: 'Freelance Designer',
      avatar: 'MD',
    },
  },
  professional: {
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-blue-500 to-purple-600',
    cta: 'Démarrer l\'essai gratuit',
    planId: 'professional',
    badge: 'LE PLUS POPULAIRE',
    popular: true,
    optionalFeatures: [
      { name: 'Support dédié 24/7', included: false },
      { name: 'Formation personnalisée', included: false },
    ],
    testimonial: {
      quote: "Le rapport qualité/prix est imbattable. J'ai multiplié ma productivité par 5 !",
      author: 'Sophie L.',
      company: 'Agence Créative',
      avatar: 'SL',
    },
  },
  business: {
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    icon: <Rocket className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-600',
    cta: 'Démarrer l\'essai gratuit',
    planId: 'business',
    optionalFeatures: [
      { name: 'Clusters régionaux additionnels', included: false },
      { name: 'Support dédié 24/7', included: false },
    ],
    testimonial: {
      quote: "Indispensable pour notre équipe de 15 créatifs. La collaboration temps réel est un game-changer.",
      author: 'Pierre M.',
      company: 'Studio Design Paris',
      avatar: 'PM',
    },
  },
  enterprise: {
    description: 'Solution sur-mesure pour les grandes organisations et multi-divisions',
    icon: <Building2 className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-600',
    cta: 'Contacter les ventes',
    planId: 'enterprise',
    href: '/contact?type=enterprise',
    yearlyDiscount: 0,
    testimonial: {
      quote: "Déployé dans 12 pays en 3 mois. L'équipe Luneo a été exceptionnelle.",
      author: 'Caroline B.',
      company: 'Fortune 500 Retail',
      avatar: 'CB',
    },
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
          ? '/mois'
          : quota.period === 'day'
            ? '/jour'
            : `/${quota.period}`,
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
      testimonial: marketing.testimonial,
    };
  });
};

const PLANS = buildPricingPlans();

const FAQS: FAQ[] = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Absolument ! Vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre dashboard. Les changements sont appliqués immédiatement et la facturation est ajustée au prorata. Pas de frais cachés, pas de pénalités.",
    category: 'billing',
  },
  {
    question: "Comment fonctionne l'essai gratuit de 14 jours ?",
    answer: "L'essai gratuit vous donne accès à toutes les fonctionnalités du plan Professional pendant 14 jours, sans carte bancaire requise. À la fin de l'essai, vous pouvez choisir le plan qui vous convient ou rester sur le plan gratuit Starter.",
    category: 'trial',
  },
  {
    question: "Acceptez-vous les paiements par virement bancaire ?",
    answer: "Oui, pour les plans Business et Enterprise, nous acceptons les virements bancaires (SEPA, SWIFT) avec facturation mensuelle, trimestrielle ou annuelle. Contactez notre équipe commerciale pour configurer ce mode de paiement.",
    category: 'billing',
  },
  {
    question: "Que se passe-t-il si je dépasse ma limite mensuelle ?",
    answer: "Nous vous préviendrons par email lorsque vous approchez de 80% et 100% de votre limite. Vous pouvez soit upgrader votre plan instantanément, soit attendre le renouvellement mensuel. Nous ne bloquerons jamais votre accès sans préavis et aucun frais de dépassement n'est appliqué.",
    category: 'usage',
  },
  {
    question: "Proposez-vous des réductions pour les associations ou startups ?",
    answer: "Oui ! Nous offrons jusqu'à 50% de réduction pour les associations à but non lucratif, les établissements d'enseignement, et les startups en phase d'amorçage (moins de 2 ans, <€1M de CA). Contactez-nous avec un justificatif et nous activerons la réduction.",
    category: 'discount',
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Oui, vous pouvez annuler en 1 clic depuis votre dashboard, sans frais ni pénalités. Vous conserverez l'accès à toutes les fonctionnalités jusqu'à la fin de votre période de facturation en cours. Vos données restent accessibles 30 jours après l'annulation pour les exporter.",
    category: 'billing',
  },
  {
    question: "Les fichiers exportés sont-ils vraiment print-ready ?",
    answer: "Absolument. Nos exports sont certifiés pour l'impression professionnelle : 300 DPI minimum, profils couleur CMYK (ISO Coated v2, US Web Coated SWOP), format PDF/X-4, marges de découpe 3mm automatiques. Acceptés par 99%+ des imprimeurs professionnels.",
    category: 'features',
  },
  {
    question: "Quelles plateformes e-commerce supportez-vous ?",
    answer: "Nous avons des intégrations natives avec Shopify, WooCommerce, Magento 2, PrestaShop, BigCommerce, Wix, et Squarespace. Pour les plateformes custom ou autres CMS, notre API REST et webhooks permettent une intégration complète en quelques heures.",
    category: 'features',
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "La sécurité est notre priorité. Infrastructure AWS hébergée en Europe (Paris, Francfort), conforme RGPD. Chiffrement AES-256 au repos, TLS 1.3 en transit. SSO (SAML 2.0, OAuth) et 2FA disponibles. SOC 2 Type II en cours de certification Q2 2025.",
    category: 'security',
  },
  {
    question: "Proposez-vous une garantie satisfait ou remboursé ?",
    answer: "Oui ! Si vous n'êtes pas satisfait dans les 30 premiers jours après votre premier paiement, nous vous remboursons intégralement, sans questions. Nous croyons en notre produit et voulons que vous soyez 100% convaincu.",
    category: 'guarantee',
  },
];

const TRUST_BADGES = [
  { icon: <Shield className="w-5 h-5" />, label: 'RGPD Compliant' },
  { icon: <Lock className="w-5 h-5" />, label: 'SSL Sécurisé' },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Paiement sécurisé' },
  { icon: <RefreshCw className="w-5 h-5" />, label: '30j remboursé' },
];

const COMPARISON_FEATURES = [
  { name: 'Designs par mois', starter: '10', professional: '100', business: '500', enterprise: 'Illimité' },
  { name: 'Génération IA', starter: '5/mois', professional: '50/mois', business: '200/mois', enterprise: 'Illimité' },
  { name: 'Modèles 3D', starter: '2', professional: '20', business: '100', enterprise: 'Illimité' },
  { name: 'Exports HD', starter: false, professional: true, business: true, enterprise: true },
  { name: 'Export PDF Print-Ready', starter: false, professional: true, business: true, enterprise: true },
  { name: 'Virtual Try-On', starter: false, professional: true, business: true, enterprise: true },
  { name: 'API Access', starter: false, professional: 'Basique', business: 'Complet', enterprise: 'Custom' },
  { name: 'Intégrations E-commerce', starter: '1', professional: '3', business: 'Toutes', enterprise: 'Custom' },
  { name: 'Utilisateurs inclus', starter: '1', professional: '3', business: '10', enterprise: 'Illimité' },
  { name: 'Stockage', starter: '1 GB', professional: '10 GB', business: '100 GB', enterprise: 'Illimité' },
  { name: 'Support', starter: 'Email', professional: 'Chat prioritaire', business: 'Dédié', enterprise: '24/7 + CSM' },
  { name: 'Formation', starter: false, professional: 'Webinars', business: 'Personnalisée', enterprise: 'Sur-site' },
  { name: 'SLA', starter: false, professional: false, business: '99.9%', enterprise: '99.99%' },
  { name: 'White-label', starter: false, professional: false, business: 'Partiel', enterprise: 'Complet' },
  { name: 'SSO/SAML', starter: false, professional: false, business: true, enterprise: true },
];

// ============================================
// COMPONENTS
// ============================================

// FAQ Item Component
function FAQItem({ 
  faq, 
  isOpen, 
  onToggle 
}: { 
  faq: FAQ; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={false}
      className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/50 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700/50 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ROI Calculator Component
function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInput>({
    currentDesignTime: 10,
    hourlyRate: 50,
    designsPerMonth: 50,
  });

  const calculations = useMemo(() => {
    const timeReductionFactor = 0.8; // 80% de temps économisé
    const hoursSaved = inputs.currentDesignTime * 4 * timeReductionFactor; // heures/mois
    const moneySaved = hoursSaved * inputs.hourlyRate;
    const planCost = 29; // Professional plan
    const roi = ((moneySaved - planCost) / planCost) * 100;
    const yearlyROI = (moneySaved - planCost) * 12;

    return {
      hoursSaved: Math.round(hoursSaved),
      moneySaved: Math.round(moneySaved),
      roi: Math.round(roi),
      yearlyROI: Math.round(yearlyROI),
    };
  }, [inputs]);

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/20 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Calculateur de ROI</h3>
          <p className="text-sm text-gray-400">Estimez vos économies avec Luneo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Heures de design/semaine
          </label>
          <input
            type="number"
            value={inputs.currentDesignTime}
            onChange={(e) => setInputs({ ...inputs, currentDesignTime: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            min="1"
            max="80"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Taux horaire (€)
          </label>
          <input
            type="number"
            value={inputs.hourlyRate}
            onChange={(e) => setInputs({ ...inputs, hourlyRate: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            min="10"
            max="500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Designs/mois actuels
          </label>
          <input
            type="number"
            value={inputs.designsPerMonth}
            onChange={(e) => setInputs({ ...inputs, designsPerMonth: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            min="1"
            max="1000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{calculations.hoursSaved}h</div>
          <div className="text-xs text-gray-400">économisées/mois</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{formatNumber(calculations.moneySaved)}€</div>
          <div className="text-xs text-gray-400">économisés/mois</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{calculations.roi}%</div>
          <div className="text-xs text-gray-400">ROI mensuel</div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center border border-green-500/30">
          <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">{formatNumber(calculations.yearlyROI)}€</div>
          <div className="text-xs text-green-300">économisés/an</div>
        </div>
      </div>
    </Card>
  );
}

// Pricing Card Component
function PricingCard({ 
  plan, 
  billingPeriod, 
  loading, 
  onCheckout 
}: { 
  plan: PricingPlanCard; 
  billingPeriod: 'monthly' | 'yearly';
  loading: string | null;
  onCheckout: (planId: string, isYearly: boolean) => void;
}) {
  const price = billingPeriod === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.priceMonthly;
  const savings = plan.priceMonthly * 12 - plan.yearlyPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="relative h-full"
    >
      {/* Popular Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-500/30">
            <Crown className="w-4 h-4 mr-1.5" />
            {plan.badge}
          </span>
        </div>
      )}

      <Card className={`h-full flex flex-col bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 ${
        plan.popular 
          ? 'border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
          : 'border-gray-700/50 hover:border-gray-600'
      }`}>
        {/* Header */}
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${plan.gradient} text-white mb-4 shadow-lg`}>
            {plan.icon}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-bold text-white">
              {plan.tier === 'enterprise' ? 'Sur demande' : price === 0 ? 'Gratuit' : `${formatPrice(price)}€`}
            </span>
            {price > 0 && plan.tier !== 'enterprise' && <span className="text-gray-400">/mois</span>}
          </div>
          
          {billingPeriod === 'yearly' && plan.yearlyDiscount > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400">
                {formatPrice(plan.yearlyPrice)}€ facturé annuellement
              </p>
              <p className="text-sm text-green-400 font-semibold flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Économisez {formatPrice(savings)}€/an
              </p>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mb-6">
          {plan.href ? (
            <Link href={plan.href} className="block">
              <Button className={`w-full h-12 font-semibold transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-gray-600'
              }`}>
                {plan.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : plan.planId ? (
            <Button
              onClick={() => onCheckout(plan.planId!, billingPeriod === 'yearly')}
              disabled={loading === plan.planId}
              className={`w-full h-12 font-semibold transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-gray-600'
              }`}
            >
              {loading === plan.planId ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Chargement...
                </div>
              ) : (
                <>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : null}
        </div>

        {/* Key Quotas */}
        <div className="mb-6 pb-6 border-b border-gray-700/50">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            Inclus dans ce plan
          </p>
          <div className="space-y-2">
            {plan.quotas.slice(0, 4).map((quota, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{quota.label}</span>
                <span className="text-white font-medium">
                  {quota.value}
                  <span className="text-gray-500 text-xs ml-1">{quota.period}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            Fonctionnalités
          </p>
          <div className="space-y-2.5">
            {plan.features.slice(0, 8).map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {feature.included ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        {plan.testimonial && (
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                {plan.testimonial.avatar}
              </div>
              <div>
                <p className="text-xs text-gray-400 italic mb-1">"{plan.testimonial.quote}"</p>
                <p className="text-xs text-gray-500">
                  <span className="text-gray-300 font-medium">{plan.testimonial.author}</span>
                  {' · '}{plan.testimonial.company}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Récupérer les plans depuis l'API (Stripe ou fallback)
  const { 
    plans: dynamicPlans, 
    loading: plansLoading, 
    error: plansError,
    stripeEnabled,
    refresh: refreshPlans 
  } = usePricingPlans({ interval: billingPeriod });

  // Fusionner les plans dynamiques avec les données marketing statiques
  const mergedPlans = useMemo(() => {
    if (dynamicPlans.length === 0) {
      // Fallback aux plans statiques si l'API échoue
      return PLANS;
    }

    // Mapper les plans dynamiques avec les présentations marketing
    return dynamicPlans.map((dynamicPlan) => {
      // Trouver le plan statique correspondant
      const staticPlan = PLANS.find(
        (p) => p.tier === dynamicPlan.id || p.name.toLowerCase() === dynamicPlan.name.toLowerCase()
      );

      if (staticPlan) {
        // Fusionner les prix dynamiques avec les données marketing statiques
        return {
          ...staticPlan,
          priceMonthly: dynamicPlan.price.monthly ?? staticPlan.priceMonthly,
          yearlyPrice: dynamicPlan.price.yearly ?? staticPlan.yearlyPrice,
          // Garder les features du plan statique si dynamique n'en a pas
          features: dynamicPlan.features.length > 0 
            ? dynamicPlan.features.map((f) => ({ name: f.name, included: f.included }))
            : staticPlan.features,
        };
      }

      // Si pas de correspondance, créer un nouveau plan
      return {
        tier: dynamicPlan.id as PlanTier,
        name: dynamicPlan.name,
        icon: <Sparkles className="w-6 h-6" />,
        description: dynamicPlan.description,
        gradient: 'from-gray-500 to-gray-600',
        cta: 'Commencer',
        planId: dynamicPlan.id,
        priceMonthly: dynamicPlan.price.monthly ?? 0,
        yearlyPrice: dynamicPlan.price.yearly ?? 0,
        yearlyDiscount: 0.2,
        features: dynamicPlan.features.map((f) => ({ name: f.name, included: f.included })),
        quotas: [],
        popular: dynamicPlan.popular,
      };
    });
  }, [dynamicPlans]);

  const handleCheckout = useCallback(async (planId: string, isYearly: boolean) => {
    if (!planId || checkoutLoading === planId) return;

    setCheckoutLoading(planId);
    
    try {
      let userEmail: string | undefined;
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email;
      } catch (e) {
        logger.debug('Utilisateur non connecté', { planId });
      }

      logger.info('Création session checkout', { planId, billing: isYearly ? 'yearly' : 'monthly', stripeEnabled });

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billing: isYearly ? 'yearly' : 'monthly',
          ...(userEmail && { email: userEmail }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      const checkoutUrl = data.url || (data.success && data.url);
      
      if (checkoutUrl) {
        setCheckoutLoading(null);
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 100);
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Erreur checkout', { error, planId });
      setCheckoutLoading(null);
      alert(`Erreur: ${errorMessage}\n\nSi le problème persiste, contactez le support.`);
    }
  }, [checkoutLoading, stripeEnabled]);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950/30 to-purple-950/30">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Gift className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                14 jours d'essai gratuit · Sans carte bancaire
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Des tarifs{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                simples et transparents
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choisissez le plan adapté à vos besoins. Évoluez quand vous le souhaitez.
              <br className="hidden sm:block" />
              <span className="text-blue-400 font-semibold">Annulez à tout moment, sans frais.</span>
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-gray-700">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annuel
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  -20%
                </span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
              {TRUST_BADGES.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-green-400">{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Plans Grid */}
          {plansLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <p className="text-gray-400">Chargement des plans...</p>
            </div>
          ) : plansError ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-gray-400 mb-4">Erreur lors du chargement des plans</p>
              <Button 
                onClick={() => refreshPlans()}
                variant="outline"
                className="border-purple-500/50 text-purple-400"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6">
              {mergedPlans.map((plan, index) => (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <PricingCard
                    plan={plan}
                    billingPeriod={billingPeriod}
                    loading={checkoutLoading}
                    onCheckout={handleCheckout}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Stripe Status Badge */}
          {stripeEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Paiements sécurisés par Stripe</span>
              </div>
            </motion.div>
          )}

          {/* Enterprise CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <p className="text-gray-400 mb-4">
              Besoin d'une solution sur-mesure pour votre organisation ?
            </p>
            <Link href="/contact?type=enterprise">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                <Building2 className="w-4 h-4 mr-2" />
                Contacter l'équipe Enterprise
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ROI CALCULATOR */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Estimez vos économies</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Calculez votre{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                retour sur investissement
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Découvrez combien vous pouvez économiser en temps et en argent avec Luneo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ROICalculator />
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMPARISON TABLE */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Comparaison{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                détaillée
              </span>
            </h2>
            <p className="text-gray-400">
              Toutes les fonctionnalités en un coup d'œil
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 text-left text-sm font-semibold text-gray-400">Fonctionnalité</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Starter</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-white bg-blue-500/10 rounded-t-lg">
                    <div className="flex items-center justify-center gap-2">
                      Professional
                      <Crown className="w-4 h-4 text-blue-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Business</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-sm text-gray-300">{feature.name}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-400">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center bg-blue-500/5">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-white font-medium">{feature.professional}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">{feature.business}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* GUARANTEE SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Garantie{' '}
              <span className="text-green-400">Satisfait ou Remboursé</span>
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Nous sommes tellement confiants que vous allez adorer Luneo que nous offrons une{' '}
              <strong className="text-white">garantie de remboursement de 30 jours</strong>, sans questions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-6 bg-gray-800/30 rounded-xl">
                <Clock className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-1">14 jours gratuits</h4>
                <p className="text-sm text-gray-400 text-center">Sans carte bancaire</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-gray-800/30 rounded-xl">
                <RefreshCw className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-1">30 jours remboursé</h4>
                <p className="text-sm text-gray-400 text-center">Après 1er paiement</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-gray-800/30 rounded-xl">
                <HeartHandshake className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-1">Sans engagement</h4>
                <p className="text-sm text-gray-400 text-center">Annulez quand vous voulez</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Questions{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                fréquentes
              </span>
            </h2>
            <p className="text-gray-400">
              Tout ce que vous devez savoir sur nos tarifs
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <FAQItem
                  faq={faq}
                  isOpen={openFaqIndex === index}
                  onToggle={() => toggleFAQ(index)}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-gray-400 mb-4">Vous avez d'autres questions ?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter le support
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                  <Phone className="w-4 h-4 mr-2" />
                  Réserver une démo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              animate={{ y: [0, -600], opacity: [0, 1, 0] }}
              transition={{ 
                duration: 4 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 4,
                ease: 'linear'
              }}
              style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Prêt à transformer votre workflow ?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Rejoignez <strong className="text-white">10 000+ créateurs</strong> qui économisent{' '}
              <strong className="text-white">des heures chaque semaine</strong> avec Luneo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 font-bold px-10 py-6 text-lg shadow-2xl">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 font-bold px-10 py-6 text-lg">
                  <Headphones className="w-5 h-5 mr-2" />
                  Parler à un expert
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>14 jours gratuits</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Annulation en 1 clic</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Support français 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
