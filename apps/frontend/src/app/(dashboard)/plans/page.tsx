'use client';

import React, { useState, useMemo, memo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check, X, Zap, Crown, Building, Sparkles, ArrowRight, HeadphonesIcon
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PRICING } from '@/lib/pricing-constants';
import { endpoints } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceAnnual: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
  features: string[];
  limits: {
    designs: string;
    storage: string;
    users: string;
    aiGenerations: string;
  };
  highlights: string[];
}

function PlansPageContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  /**
   * Plans aligned with backend SINGLE SOURCE OF TRUTH: plan-config.ts
   * FREE(0€) | STARTER(19€) | PROFESSIONAL(49€) | BUSINESS(99€) | ENTERPRISE(299€)
   */
  const plans: Plan[] = useMemo(() => [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceAnnual: 0,
      icon: <Sparkles className="w-8 h-8" />,
      color: 'gray',
      gradient: 'from-gray-600 to-slate-600',
      description: 'Découvrez Luneo gratuitement avec les fonctionnalités essentielles',
      features: [
        '5 designs/mois',
        '0.5 GB de stockage',
        '1 utilisateur',
        '2 produits',
        'Customizer 2D',
        '3 générations IA/mois',
        'Export PNG/JPG',
        'Support par email'
      ],
      limits: {
        designs: '5/mois',
        storage: '0.5 GB',
        users: '1',
        aiGenerations: '3/mois'
      },
      highlights: ['Gratuit pour toujours', 'Idéal pour tester']
    },
    {
      id: 'starter',
      name: 'Starter',
      price: PRICING.starter.monthly,
      priceAnnual: PRICING.starter.yearly,
      icon: <Zap className="w-8 h-8" />,
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      description: 'Parfait pour démarrer et créer vos premiers designs professionnels',
      features: [
        '50 designs/mois',
        '5 GB de stockage',
        '3 utilisateurs',
        '10 produits',
        'Customizer 2D',
        '20 générations IA/mois',
        'Rendu 3D (10/mois)',
        'API (10 000 appels/mois)',
        'Support prioritaire'
      ],
      limits: {
        designs: '50/mois',
        storage: '5 GB',
        users: '3',
        aiGenerations: '20/mois'
      },
      highlights: ['Pour bien démarrer', 'Support prioritaire']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: PRICING.professional.monthly,
      priceAnnual: PRICING.professional.yearly,
      icon: <Zap className="w-8 h-8" />,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      description: 'Pour les créateurs professionnels avec des besoins avancés',
      features: [
        '200 designs/mois',
        '25 GB de stockage',
        '10 utilisateurs',
        '50 produits',
        'Customizer 2D + Configurateur 3D',
        '100 générations IA/mois',
        'Rendu 3D (50/mois)',
        'Virtual Try-On (partiel)',
        'AR activé',
        'API (50 000 appels/mois)',
        'White label',
        'Support prioritaire',
        'Intégrations e-commerce'
      ],
      limits: {
        designs: '200/mois',
        storage: '25 GB',
        users: '10',
        aiGenerations: '100/mois'
      },
      highlights: ['Le plus populaire', 'AR & 3D inclus', 'White label']
    },
    {
      id: 'business',
      name: 'Business',
      price: PRICING.business.monthly,
      priceAnnual: PRICING.business.yearly,
      icon: <Building className="w-8 h-8" />,
      color: 'orange',
      gradient: 'from-orange-600 to-red-600',
      description: 'Solution complète pour équipes et entreprises en croissance',
      features: [
        '1 000 designs/mois',
        '100 GB de stockage',
        '50 utilisateurs',
        '500 produits',
        'Toutes les fonctionnalités Pro',
        '500 générations IA/mois',
        'Rendu 3D (200/mois)',
        'Virtual Try-On complet',
        'AR/VR export',
        'Bulk generation',
        'White-label',
        'Analytics avancés',
        'Export personnalisé',
        'Webhooks',
        'API (200 000 appels/mois)',
        'SLA 99.9%',
        'Account manager dédié'
      ],
      limits: {
        designs: '1 000/mois',
        storage: '100 GB',
        users: '50',
        aiGenerations: '500/mois'
      },
      highlights: ['Pour équipes', 'Analytics avancés', 'Account manager']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: PRICING.enterprise.monthly,
      priceAnnual: PRICING.enterprise.yearly,
      icon: <Crown className="w-8 h-8" />,
      color: 'yellow',
      gradient: 'from-yellow-600 to-amber-600',
      description: 'Solution sur-mesure pour grandes entreprises avec besoins spécifiques',
      features: [
        'Designs illimités',
        'Stockage illimité',
        'Utilisateurs illimités',
        'Produits illimités',
        'Toutes les fonctionnalités Business',
        'Générations IA illimitées',
        'Infrastructure dédiée',
        'SSO/SAML',
        'Audit logs',
        'Conformité RGPD/HIPAA',
        'SLA 99.99%',
        'Support 24/7 dédié',
        'Développement sur-mesure',
        'Déploiement on-premise',
        'Formation avancée',
        'Intégration système'
      ],
      limits: {
        designs: 'Illimité',
        storage: 'Illimité',
        users: 'Illimité',
        aiGenerations: 'Illimité'
      },
      highlights: ['Tout illimité', 'Infrastructure dédiée', 'SSO/SAML']
    }
  ], []);

  /**
   * Feature comparison aligned with backend plan-config.ts
   * 5 columns: Free | Starter | Professional | Business | Enterprise
   */
  const comparisonFeatures = [
    {
      category: 'Création & Design',
      features: [
        { name: 'Customizer 2D', free: true, starter: true, pro: true, business: true, enterprise: true },
        { name: 'Configurateur 3D', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'Virtual Try-On', free: false, starter: false, pro: 'Partiel', business: true, enterprise: true },
        { name: 'AR/VR Export', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'White Label', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'Templates', free: 'Base', starter: 'Base', pro: 'Premium', business: 'Tous', enterprise: 'Illimité' },
      ]
    },
    {
      category: 'Intelligence Artificielle',
      features: [
        { name: 'Génération IA', free: '3/mois', starter: '20/mois', pro: '100/mois', business: '500/mois', enterprise: 'Illimité' },
        { name: 'Rendu 3D', free: false, starter: '10/mois', pro: '50/mois', business: '200/mois', enterprise: 'Illimité' },
        { name: 'Bulk Generation', free: false, starter: false, pro: false, business: true, enterprise: true },
        { name: 'AI Design Hub', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'Modèles IA personnalisés', free: false, starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Collaboration',
      features: [
        { name: 'Utilisateurs', free: '1', starter: '3', pro: '10', business: '50', enterprise: 'Illimité' },
        { name: 'Produits', free: '2', starter: '10', pro: '50', business: '500', enterprise: 'Illimité' },
        { name: 'Stockage', free: '0.5 GB', starter: '5 GB', pro: '25 GB', business: '100 GB', enterprise: 'Illimité' },
        { name: 'Partage de designs', free: false, starter: true, pro: true, business: true, enterprise: true },
        { name: 'Permissions granulaires', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'SSO/SAML', free: false, starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Intégrations',
      features: [
        { name: 'API Access', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'Appels API/mois', free: '-', starter: '10 000', pro: '50 000', business: '200 000', enterprise: 'Illimité' },
        { name: 'Webhooks', free: false, starter: false, pro: false, business: true, enterprise: true },
        { name: 'E-commerce (Shopify, WooCommerce)', free: false, starter: false, pro: true, business: true, enterprise: true },
        { name: 'Intégrations personnalisées', free: false, starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Support & Services',
      features: [
        { name: 'Support', free: 'Email', starter: 'Email', pro: 'Prioritaire', business: '24/7 Prioritaire', enterprise: '24/7 Dédié' },
        { name: 'SLA', free: '-', starter: '-', pro: '-', business: '99.9%', enterprise: '99.99%' },
        { name: 'Account Manager', free: false, starter: false, pro: false, business: true, enterprise: true },
        { name: 'Analytics avancés', free: false, starter: false, pro: false, business: true, enterprise: true },
        { name: 'Export personnalisé', free: false, starter: false, pro: false, business: true, enterprise: true },
        { name: 'Formation', free: false, starter: false, pro: false, business: 'Incluse', enterprise: 'Avancée' },
      ]
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    try {
      const interval = billingPeriod === 'annual' ? 'yearly' : 'monthly';
      type SubscribeResponse = { data?: { url?: string; sessionUrl?: string }; url?: string; sessionUrl?: string };
      const result = await endpoints.billing.subscribe(planId, undefined, interval) as SubscribeResponse;
      const url = result?.data?.url ?? result?.data?.sessionUrl ?? result?.url ?? result?.sessionUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Impossible de créer la session de paiement');
        setSelectedPlan(null);
      }
    } catch (err) {
      toast.error('Une erreur est survenue lors de la redirection vers le paiement');
      setSelectedPlan(null);
    }
  };

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-600 mx-auto" />
      );
    }
    return <span className="text-white text-sm">{value}</span>;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Choisissez le plan parfait pour vous
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Commencez gratuitement, upgradez quand vous êtes prêt. Annulez à tout moment.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 p-1 bg-gray-800 rounded-lg border border-gray-700">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
              billingPeriod === 'annual'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Annuel
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan, index) => {
          const price = billingPeriod === 'monthly' ? plan.price : plan.priceAnnual;
          const isPopular = plan.id === 'professional';
          const isEnterprise = plan.id === 'enterprise';

          return (
            <motion
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`p-6 bg-gray-800/50 border-gray-700 h-full flex flex-col relative ${
                  isPopular ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-medium">
                    ⭐ Plus populaire
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${plan.gradient} bg-opacity-10 mb-4`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-2">
                    {isEnterprise ? (
                      <div className="text-3xl font-bold text-white">Sur devis</div>
                    ) : price === 0 ? (
                      <div className="text-3xl font-bold text-white">Gratuit</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">{price}€</span>
                        <span className="text-gray-400 ml-2">
                          {billingPeriod === 'monthly' ? '/mois' : '/an'}
                        </span>
                        {billingPeriod === 'annual' && (
                          <div className="text-sm text-gray-500 mt-1">
                            soit {Math.round(price / 12)}€/mois
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {plan.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plan.highlights.map((highlight, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                  <div className="space-y-3">
                    {plan.features.slice(0, 8).map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 8 && (
                      <div className="text-sm text-gray-400 italic">
                        + {plan.features.length - 8} autres fonctionnalités
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => isEnterprise ? window.location.href = '/contact' : handleUpgrade(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full ${
                    isPopular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {selectedPlan === plan.id ? (
                    'Chargement...'
                  ) : isEnterprise ? (
                    <>
                      Nous contacter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : plan.id === 'free' ? (
                    'Commencer gratuitement'
                  ) : (
                    'Choisir ce plan'
                  )}
                </Button>
              </Card>
            </motion>
          );
        })}
      </div>

      {/* Comparison Table */}
      <Card className="p-8 bg-gray-800/50 border-gray-700 overflow-x-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Comparaison détaillée</h2>
        <div className="min-w-[800px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 text-gray-400 font-medium">Fonctionnalité</th>
                <th className="text-center py-4 text-white font-medium">Free</th>
                <th className="text-center py-4 text-white font-medium">Starter</th>
                <th className="text-center py-4 text-white font-medium">Professional</th>
                <th className="text-center py-4 text-white font-medium">Business</th>
                <th className="text-center py-4 text-white font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((category, catIndex) => (
                <React.Fragment key={catIndex}>
                  <tr className="bg-gray-900/30">
                    <td colSpan={6} className="py-3 px-4 text-white font-bold text-sm">
                      {category.category}
                    </td>
                  </tr>
                  {category.features.map((feature, featIndex) => (
                    <tr key={featIndex} className="border-b border-gray-800 hover:bg-gray-900/20">
                      <td className="py-3 text-gray-300 text-sm">{feature.name}</td>
                      <td className="py-3 text-center">{renderFeatureValue(feature.free)}</td>
                      <td className="py-3 text-center">{renderFeatureValue(feature.starter)}</td>
                      <td className="py-3 text-center">{renderFeatureValue(feature.pro)}</td>
                      <td className="py-3 text-center">{renderFeatureValue(feature.business)}</td>
                      <td className="py-3 text-center">{renderFeatureValue(feature.enterprise)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="p-8 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Questions fréquentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: 'Puis-je changer de plan à tout moment ?',
              a: 'Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements prennent effet immédiatement.'
            },
            {
              q: 'Y a-t-il une période d\'essai ?',
              a: 'Le plan Starter est gratuit à vie. Pour les autres plans, contactez-nous pour un essai gratuit de 14 jours.'
            },
            {
              q: 'Que se passe-t-il si je dépasse mes limites ?',
              a: 'Nous vous notifierons avant d\'atteindre vos limites. Vous pouvez soit upgrader, soit attendre le mois suivant.'
            },
            {
              q: 'Les paiements sont-ils sécurisés ?',
              a: 'Oui, tous les paiements sont traités par Stripe avec chiffrement SSL/TLS et conformité PCI-DSS.'
            },
            {
              q: 'Puis-je obtenir une facture ?',
              a: 'Oui, une facture est générée automatiquement pour chaque paiement et envoyée par email.'
            },
            {
              q: 'Proposez-vous des réductions pour ONG/Éducation ?',
              a: 'Oui, nous offrons des réductions spéciales. Contactez-nous avec les détails de votre organisation.'
            }
          ].map((faq, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-white font-medium">{faq.q}</h3>
              <p className="text-sm text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="p-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Besoin d'aide pour choisir ?
          </h2>
          <p className="text-gray-300 mb-6">
            Notre équipe est là pour vous aider à trouver le plan parfait pour vos besoins.
          </p>
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <HeadphonesIcon className="w-4 h-4 mr-2" />
              Parler à un expert
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

const MemoizedPlansPageContent = memo(PlansPageContent);

export default function PlansPage() {
  return (
    <ErrorBoundary level="page" componentName="PlansPage">
      <MemoizedPlansPageContent />
    </ErrorBoundary>
  );
}
