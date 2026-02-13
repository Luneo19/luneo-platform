'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useParams } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ArrowRight, CheckCircle, Package, Sparkles, Zap, Box } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

interface IndustryStat {
  value: string;
  label: string;
}
const industriesData: Record<string, {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  stats: IndustryStat[];
  useCases: string[];
  testimonial: { quote: string; author: string; role: string; company: string; metric: string };
}> = {
  'printing': {
    name: 'Printing & Print-on-Demand',
    icon: <Package className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'blue',
    description: 'Automatisez votre workflow print avec des fichiers prêts à imprimer',
    stats: [
      { value: '90%', label: 'Réduction temps' },
      { value: '€50k', label: 'Économie/an' },
      { value: '-80%', label: 'Workflow' }
    ],
    useCases: [
      'T-shirts sublimation',
      'Mugs personnalisés',
      'Cartes de visite',
      'Packaging custom',
      'Stickers & décalcomanies',
      'Textile personnalisé'
    ],
    testimonial: {
      quote: 'Fichiers print-ready automatiques = game-changer. Plus de 80% de workflow streamliné.',
      author: 'Christian M.',
      role: 'Creative Director',
      company: 'KAZE CLUB',
      metric: '-80% workflow'
    }
  },
  'fashion': {
    name: 'Mode & Textile',
    icon: <Sparkles className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'purple',
    description: 'Créez des collections personnalisées avec visualisation 3D',
    stats: [
      { value: '+500%', label: 'Croissance' },
      { value: '100%', label: 'Sell-out' },
      { value: '€0', label: 'Échantillons' }
    ],
    useCases: [
      'Collections personnalisées',
      'Visualisation 3D vêtements',
      'Virtual try-on mode',
      'Mockups professionnels',
      'Catalogues produits',
      'Lookbooks digitaux'
    ],
    testimonial: {
      quote: 'De 100 à 600 commandes/mois sans embaucher. Luneo a permis notre scale.',
      author: 'Marie B.',
      role: 'CEO',
      company: 'LA FABRIQUE À SACHETS',
      metric: '+500% croissance'
    }
  },
  'sports': {
    name: 'Sports & Fitness',
    icon: <Zap className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'green',
    description: 'Équipements sportifs personnalisés avec AR try-on',
    stats: [
      { value: '+40%', label: 'Conversion' },
      { value: '-35%', label: 'Retours' },
      { value: '3D', label: 'Visualisation' }
    ],
    useCases: [
      'Maillots personnalisés',
      'Casquettes & chapeaux',
      'Bouteilles sport custom',
      'Équipement fitness',
      'Accessoires training',
      'Chaussures design'
    ],
    testimonial: {
      quote: '+40% conversion avec essayage virtuel. Moins de retours, plus de satisfaction.',
      author: 'Alexandre D.',
      role: 'Founder',
      company: 'FLEX ARCADE',
      metric: '+40% conversion'
    }
  },
  'gifting': {
    name: 'Cadeaux & Gadgets',
    icon: <Box className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'pink',
    description: 'Cadeaux personnalisés avec génération IA rapide',
    stats: [
      { value: '100', label: 'Designs/jour' },
      { value: '€0.50', label: 'Par design' },
      { value: '10x', label: 'Production' }
    ],
    useCases: [
      'Cadeaux d\'entreprise',
      'Événements spéciaux',
      'Gadgets promotionnels',
      'Articles de fête',
      'Souvenirs personnalisés',
      'Box cadeaux custom'
    ],
    testimonial: {
      quote: '100 designs par jour vs 5 avant. Le bulk generation a tout changé.',
      author: 'Marin N.',
      role: 'CEO',
      company: 'BELFORTI',
      metric: '100 designs/jour'
    }
  },
  'jewellery': {
    name: 'Bijouterie & Joaillerie',
    icon: <Sparkles className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'yellow',
    description: 'Bijoux personnalisés avec rendu 3D ultra-réaliste',
    stats: [
      { value: '100%', label: 'Sell-out' },
      { value: '€50k', label: 'Économie' },
      { value: '3D', label: 'Photoréaliste' }
    ],
    useCases: [
      'Bagues personnalisées',
      'Colliers gravés',
      'Bracelets custom',
      'Montres design',
      'Boucles d\'oreilles',
      'Accessoires luxe'
    ],
    testimonial: {
      quote: 'Visualisation 3D premium = zéro échantillon inutile. 100% de sell-out.',
      author: 'Francesco C.',
      role: 'COO',
      company: 'DESIGN ITALIAN SHOES',
      metric: '100% sell-out'
    }
  },
  'furniture': {
    name: 'Mobilier & Décoration',
    icon: <Box className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'orange',
    description: 'Meubles personnalisés avec configurateur 3D',
    stats: [
      { value: '+85%', label: 'Confiance' },
      { value: '360°', label: 'Vue complète' },
      { value: 'AR', label: 'Dans votre espace' }
    ],
    useCases: [
      'Meubles sur mesure',
      'Déco intérieure',
      'Textiles maison',
      'Accessoires déco',
      'Luminaires custom',
      'Rangements personnalisés'
    ],
    testimonial: {
      quote: 'Le configurateur 3D a augmenté notre taux de conversion de 85%. Incroyable.',
      author: 'Sophie L.',
      role: 'Directrice E-commerce',
      company: 'MAISON MODERNE',
      metric: '+85% confiance'
    }
  },
  'food-beverage': {
    name: 'Alimentaire & Boissons',
    icon: <Package className="w-10 h-10 sm:w-12 sm:h-12" />,
    color: 'red',
    description: 'Packaging alimentaire personnalisé avec export print-ready',
    stats: [
      { value: 'CMYK', label: 'Print-ready' },
      { value: '300dpi', label: 'HD Quality' },
      { value: 'Auto', label: 'Bleed zones' }
    ],
    useCases: [
      'Étiquettes produits',
      'Packaging premium',
      'Bouteilles personnalisées',
      'Boîtes alimentaires',
      'Sachets & wraps',
      'Stickers produits'
    ],
    testimonial: {
      quote: 'Export CMYK automatique nous a fait gagner des semaines. Qualité print parfaite.',
      author: 'Thomas R.',
      role: 'Responsable Production',
      company: 'ORGANIC FOODS CO',
      metric: 'CMYK automatique'
    }
  }
};

function IndustryPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const industry = industriesData[slug];

  if (!industry) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Industrie non trouvée</h1>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title={industry.name}
        description={industry.description}
        badge="Industrie"
        gradient="from-blue-600 via-purple-600 to-pink-600"
        cta={{
          label: 'Voir la démo',
          href: '/demo'
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
          {/* Stats */}
        <section className="dark-section relative noise-overlay py-16 sm:py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {industry.stats.map((stat: IndustryStat, i: number) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
              >
                  <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="dark-section relative noise-overlay py-16 sm:py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <SectionHeader
            title="Cas d'usage"
            description="Solutions adaptées à vos besoins"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industry.useCases.map((useCase: string, i: number) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] hover:border-purple-500/50 transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-slate-300">{useCase}</span>
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="dark-section relative noise-overlay py-16 sm:py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-6 sm:p-8 md:p-10 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                  {industry.testimonial.author.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {industry.testimonial.metric}
                  </div>
                  <div className="text-sm text-slate-400">{industry.testimonial.company}</div>
                </div>
              </div>

              <blockquote className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 italic leading-relaxed">
                "{industry.testimonial.quote}"
              </blockquote>

              <div>
                <div className="font-semibold text-white">{industry.testimonial.author}</div>
                <div className="text-sm text-slate-400">{industry.testimonial.role}</div>
              </div>
            </Card>
          </motion>
        </div>
      </section>

      <CTASectionNew />
    </div>
    </>
  );
}

const IndustryPageMemo = memo(IndustryPageContent);

export default function IndustryPage() {
  return (
    <ErrorBoundary componentName="IndustryPage">
      <IndustryPageMemo />
    </ErrorBoundary>
  );
}
