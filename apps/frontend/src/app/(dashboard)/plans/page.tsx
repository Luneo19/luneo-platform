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

  const plans: Plan[] = useMemo(() => [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      priceAnnual: 0,
      icon: <Sparkles className="w-8 h-8" />,
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      description: 'Parfait pour découvrir Luneo et créer vos premiers designs',
      features: [
        '100 designs personnalisés/mois',
        '10 GB de stockage',
        '1 utilisateur',
        'Customizer 2D',
        '50 générations IA/mois',
        'Export PNG/JPG',
        'Support par email',
        'Templates de base'
      ],
      limits: {
        designs: '100/mois',
        storage: '10 GB',
        users: '1',
        aiGenerations: '50/mois'
      },
      highlights: ['Gratuit pour toujours', 'Idéal pour débuter']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: PRICING.professional.monthly,
      priceAnnual: PRICING.professional.yearly,
      icon: <Zap className="w-8 h-8" />,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      description: 'Pour les créateurs et petites entreprises qui veulent aller plus loin',
      features: [
        '1,000 designs personnalisés/mois',
        '100 GB de stockage',
        '5 utilisateurs',
        'Customizer 2D + Configurateur 3D',
        '500 générations IA/mois',
        'Virtual Try-On (lunettes, montres)',
        'Export haute résolution',
        'API access',
        'Intégrations e-commerce',
        'Support prioritaire 24/7',
        'Templates premium',
        'Branding personnalisé'
      ],
      limits: {
        designs: '1,000/mois',
        storage: '100 GB',
        users: '5',
        aiGenerations: '500/mois'
      },
      highlights: ['Le plus populaire', 'Meilleur rapport qualité/prix', 'Support 24/7']
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
        '5,000 designs personnalisés/mois',
        '500 GB de stockage',
        '20 utilisateurs',
        'Toutes les fonctionnalités Pro',
        '2,000 générations IA/mois',
        'Virtual Try-On complet',
        'AR/VR export',
        'Bulk generation',
        'White-label',
        'Analytics avancés',
        'Webhooks',
        'SLA 99.9%',
        'Account manager dédié',
        'Formation équipe',
        'Intégrations personnalisées'
      ],
      limits: {
        designs: '5,000/mois',
        storage: '500 GB',
        users: '20',
        aiGenerations: '2,000/mois'
      },
      highlights: ['Pour équipes', 'Analytics avancés', 'Account manager']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0,
      priceAnnual: 0,
      icon: <Crown className="w-8 h-8" />,
      color: 'yellow',
      gradient: 'from-yellow-600 to-amber-600',
      description: 'Solution sur-mesure pour grandes entreprises avec besoins spécifiques',
      features: [
        'Designs illimités',
        'Stockage illimité',
        'Utilisateurs illimités',
        'Toutes les fonctionnalités Business',
        'Générations IA illimitées',
        'Infrastructure dédiée',
        'SSO/SAML',
        'Audit logs',
        'Conformité RGPD/HIPAA',
        'SLA 99.99%',
        'Support 24/7 prioritaire',
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

  const comparisonFeatures = [
    {
      category: 'Création & Design',
      features: [
        { name: 'Customizer 2D', starter: true, pro: true, business: true, enterprise: true },
        { name: 'Configurateur 3D', starter: false, pro: true, business: true, enterprise: true },
        { name: 'Virtual Try-On', starter: false, pro: 'Partiel', business: true, enterprise: true },
        { name: 'AR/VR Export', starter: false, pro: false, business: true, enterprise: true },
        { name: 'Templates', starter: 'Base', pro: 'Premium', business: 'Tous', enterprise: 'Illimité' },
      ]
    },
    {
      category: 'Intelligence Artificielle',
      features: [
        { name: 'Génération IA', starter: '50/mois', pro: '500/mois', business: '2000/mois', enterprise: 'Illimité' },
        { name: 'Bulk Generation', starter: false, pro: false, business: true, enterprise: true },
        { name: 'AI Design Hub', starter: false, pro: true, business: true, enterprise: true },
        { name: 'Modèles IA personnalisés', starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Collaboration',
      features: [
        { name: 'Utilisateurs', starter: '1', pro: '5', business: '20', enterprise: 'Illimité' },
        { name: 'Partage de designs', starter: true, pro: true, business: true, enterprise: true },
        { name: 'Permissions granulaires', starter: false, pro: true, business: true, enterprise: true },
        { name: 'SSO/SAML', starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Intégrations',
      features: [
        { name: 'API Access', starter: false, pro: true, business: true, enterprise: true },
        { name: 'Webhooks', starter: false, pro: false, business: true, enterprise: true },
        { name: 'E-commerce (Shopify, WooCommerce)', starter: false, pro: true, business: true, enterprise: true },
        { name: 'Intégrations personnalisées', starter: false, pro: false, business: false, enterprise: true },
      ]
    },
    {
      category: 'Support & Services',
      features: [
        { name: 'Support', starter: 'Email', pro: '24/7', business: '24/7 Prioritaire', enterprise: '24/7 Dédié' },
        { name: 'SLA', starter: '-', pro: '-', business: '99.9%', enterprise: '99.99%' },
        { name: 'Account Manager', starter: false, pro: false, business: true, enterprise: true },
        { name: 'Formation', starter: false, pro: false, business: 'Incluse', enterprise: 'Avancée' },
      ]
    }
  ];

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    // Simulate upgrade process
    setTimeout(() => {
      window.location.href = `/checkout?plan=${planId}&period=${billingPeriod}`;
    }, 500);
  };

  const renderFeatureValue = (value: any) => {
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const price = billingPeriod === 'monthly' ? plan.price : plan.priceAnnual;
          const isPopular = plan.id === 'pro';
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
                  ) : plan.id === 'starter' ? (
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
                <th className="text-center py-4 text-white font-medium">Starter</th>
                <th className="text-center py-4 text-white font-medium">Pro</th>
                <th className="text-center py-4 text-white font-medium">Business</th>
                <th className="text-center py-4 text-white font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((category, catIndex) => (
                <React.Fragment key={catIndex}>
                  <tr className="bg-gray-900/30">
                    <td colSpan={5} className="py-3 px-4 text-white font-bold text-sm">
                      {category.category}
                    </td>
                  </tr>
                  {category.features.map((feature, featIndex) => (
                    <tr key={featIndex} className="border-b border-gray-800 hover:bg-gray-900/20">
                      <td className="py-3 text-gray-300 text-sm">{feature.name}</td>
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
