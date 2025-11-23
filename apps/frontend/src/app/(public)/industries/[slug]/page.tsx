'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Package, Sparkles, Zap, Box } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const industriesData: Record<string, any> = {
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

export default function IndustryPage() {
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
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 sm:grid-cols-12 grid-rows-6 h-full w-full">
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-500/20 animate-pulse"
                  style={{ animationDelay: `${(i * 0.1) % 3}s`, animationDuration: '3s' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {industry.icon}
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              {industry.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
            >
              {industry.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/demo">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto">
                  Voir la démo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 w-full sm:w-auto">
                  Essayer gratuitement
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {industry.stats.map((stat: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Cas d'usage
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Solutions adaptées à vos besoins
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industry.useCases.map((useCase: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 bg-gray-800/30 backdrop-blur-sm border-gray-700 hover:bg-gray-800/50 transition-all">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-300">{useCase}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-6 sm:p-8 md:p-10 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {industry.testimonial.author.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {industry.testimonial.metric}
                  </div>
                  <div className="text-sm text-gray-400">{industry.testimonial.company}</div>
                </div>
              </div>

              <blockquote className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 italic leading-relaxed">
                "{industry.testimonial.quote}"
              </blockquote>

              <div>
                <div className="font-semibold text-white">{industry.testimonial.author}</div>
                <div className="text-sm text-gray-400">{industry.testimonial.role}</div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à transformer votre business ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-10">
              Rejoignez des centaines d'entreprises qui font confiance à Luneo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 font-bold w-full sm:w-auto">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" className="bg-white/10 border-2 border-white text-white hover:bg-white/20 font-bold w-full sm:w-auto">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
