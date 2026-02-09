'use client';

import React, { memo, useMemo } from 'react';
import { Lightbulb, ShoppingCart, Megaphone, Briefcase, Package, Truck, Users } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

function UseCasesPageContent() {
  const useCases = useMemo(() => [
    { 
      name: 'E-commerce', 
      description: 'Personnalisez vos produits pour augmenter les ventes et améliorer l\'expérience client sur votre boutique en ligne',
      icon: <ShoppingCart className="w-6 h-6" />,
      link: '/use-cases/e-commerce',
      color: 'green' as const
    },
    { 
      name: 'Marketing', 
      description: 'Créez des visuels marketing personnalisés en masse pour vos campagnes publicitaires et réseaux sociaux',
      icon: <Megaphone className="w-6 h-6" />,
      link: '/use-cases/marketing',
      color: 'orange' as const
    },
    { 
      name: 'Branding', 
      description: 'Maintenez la cohérence de votre marque avec des outils de personnalisation intégrés à votre identité',
      icon: <Briefcase className="w-6 h-6" />,
      link: '/use-cases/branding',
      color: 'indigo' as const
    },
    { 
      name: 'Print-on-Demand', 
      description: 'Gérez efficacement vos commandes de produits personnalisés avec intégration complète POD',
      icon: <Package className="w-6 h-6" />,
      link: '/use-cases/print-on-demand',
      color: 'blue' as const
    },
    { 
      name: 'Dropshipping', 
      description: 'Automatisez la création de visuels pour vos produits dropshipping et augmentez vos conversions',
      icon: <Truck className="w-6 h-6" />,
      link: '/use-cases/dropshipping',
      color: 'cyan' as const
    },
    { 
      name: 'Agency', 
      description: 'Offrez des services de personnalisation à vos clients avec une plateforme professionnelle complète',
      icon: <Users className="w-6 h-6" />,
      link: '/use-cases/agency',
      color: 'purple' as const
    },
  ], []);

  return (
    <>
      <PageHero
        title="Cas d'Usage"
        description="Découvrez comment Luneo s'adapte à votre secteur d'activité et transforme votre façon de créer des produits personnalisés"
        badge="Cas d'Usage"
        gradient="from-orange-600 via-red-600 to-pink-600"
        cta={{
          label: 'Commencer maintenant',
          href: '/register'
        }}
      />

      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Des solutions adaptées à chaque secteur"
            description="Que vous soyez e-commerce, agence, ou entreprise, Luneo s'adapte à vos besoins spécifiques"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <FeatureCard
                key={useCase.name}
                icon={useCase.icon}
                title={useCase.name}
                description={useCase.description}
                href={useCase.link}
                color={useCase.color}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const UseCasesPageMemo = memo(UseCasesPageContent);

export default function UseCasesPage() {
  return (
    <ErrorBoundary componentName="UseCasesPage">
      <UseCasesPageMemo />
    </ErrorBoundary>
  );
}



