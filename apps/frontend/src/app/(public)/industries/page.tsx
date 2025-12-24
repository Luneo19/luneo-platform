'use client';

import React, { useState, useMemo, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building,
  Shirt,
  Sofa,
  Car,
  Gem,
  Dumbbell,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Globe,
  Award,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  Quote,
  Loader2,
  Package,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAllIndustries } from '@/lib/hooks/useIndustryData';

// Industry type definition
interface Industry {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  color: string;
  gradient: string;
  href: string;
  stats: {
    conversion: string;
    returns: string;
    engagement: string;
  };
  useCases: string[];
  clients: string[];
  featured?: boolean;
}

// All industries data
const industries: Industry[] = [
  {
    id: 'fashion',
    name: 'Mode & Textile',
    subtitle: 'T-shirts, vêtements, accessoires',
    description: 'Personnalisation textile complète avec visualisation temps réel. Print-on-demand, broderie, sérigraphie et DTG.',
    icon: <Shirt className="w-8 h-8" />,
    emoji: '👕',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-600',
    href: '/industries/fashion',
    stats: { conversion: '+42%', returns: '-55%', engagement: 'x3.2' },
    useCases: ['T-shirts personnalisés', 'Merch créateurs', 'Corporate wear', 'Uniformes'],
    clients: ['Printful', 'Spreadshirt', 'Teezily'],
    featured: true,
  },
  {
    id: 'furniture',
    name: 'Mobilier & Déco',
    subtitle: 'Meubles, décoration intérieure',
    description: 'Configurateur 3D photo-réaliste pour meubles et décoration. Visualisation AR dans l\'environnement du client.',
    icon: <Sofa className="w-8 h-8" />,
    emoji: '🛋️',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    href: '/industries/furniture',
    stats: { conversion: '+38%', returns: '-48%', engagement: 'x2.8' },
    useCases: ['Canapés configurables', 'Cuisine sur-mesure', 'Étagères modulaires', 'Art mural'],
    clients: ['IKEA', 'Made.com', 'Westwing'],
  },
  {
    id: 'automotive',
    name: 'Automobile',
    subtitle: 'Véhicules, accessoires auto',
    description: 'Configurateur 3D haute-fidélité pour véhicules. Personnalisation couleurs, jantes, intérieur avec rendu photo-réaliste.',
    icon: <Car className="w-8 h-8" />,
    emoji: '🚗',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
    href: '/industries/automotive',
    stats: { conversion: '+35%', returns: '-30%', engagement: 'x4.1' },
    useCases: ['Config véhicule', 'Accessoires auto', 'Tuning visuel', 'Covering'],
    clients: ['BMW', 'Audi', 'Mercedes'],
    featured: true,
  },
  {
    id: 'jewelry',
    name: 'Joaillerie & Bijoux',
    subtitle: 'Bijoux, montres, accessoires luxe',
    description: 'Essayage virtuel AR avec tracking facial 468 points. Visualisation pierres précieuses et métaux avec PBR réaliste.',
    icon: <Gem className="w-8 h-8" />,
    emoji: '💎',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-600',
    href: '/industries/jewelry',
    stats: { conversion: '+52%', returns: '-62%', engagement: 'x3.5' },
    useCases: ['Bagues personnalisées', 'Gravure bijoux', 'Try-on lunettes', 'Montres'],
    clients: ['Cartier', 'Swarovski', 'Pandora'],
    featured: true,
  },
  {
    id: 'sports',
    name: 'Sports & Outdoor',
    subtitle: 'Équipements sportifs, outdoor',
    description: 'Personnalisation équipements sportifs avec logos équipes. Configuration chaussures, vélos, raquettes.',
    icon: <Dumbbell className="w-8 h-8" />,
    emoji: '⚽',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-600',
    href: '/industries/sports',
    stats: { conversion: '+40%', returns: '-45%', engagement: 'x2.9' },
    useCases: ['Maillots équipes', 'Chaussures custom', 'Équipement ski', 'Vélos'],
    clients: ['Nike', 'Adidas', 'Decathlon'],
  },
  {
    id: 'electronics',
    name: 'Électronique',
    subtitle: 'Tech, gadgets, accessoires',
    description: 'Personnalisation coques, skins et accessoires tech. Gravure laser, impression UV sur produits électroniques.',
    icon: <Smartphone className="w-8 h-8" />,
    emoji: '📱',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-teal-600',
    href: '/industries/electronics',
    stats: { conversion: '+32%', returns: '-35%', engagement: 'x2.4' },
    useCases: ['Coques téléphone', 'Skins laptop', 'Accessoires gaming', 'AirPods'],
    clients: ['CaseApp', 'dbrand', 'Casetify'],
  },
];

// Stats globaux
const globalStats = [
  { value: '500+', label: 'Marques', icon: <Building className="w-5 h-5" /> },
  { value: '+40%', label: 'Conversion moyenne', icon: <TrendingUp className="w-5 h-5" /> },
  { value: '-50%', label: 'Retours réduits', icon: <Target className="w-5 h-5" /> },
  { value: '10M+', label: 'Produits créés', icon: <Sparkles className="w-5 h-5" /> },
];

// Témoignages
const testimonials = [
  {
    quote: "Luneo a transformé notre expérience client. Les configurateurs 3D ont augmenté nos conversions de 45%.",
    author: "Marie Laurent",
    role: "Head of E-commerce",
    company: "Made.com",
    industry: "Mobilier",
  },
  {
    quote: "L'essayage virtuel a révolutionné notre site. Les retours ont chuté de 60% sur les lunettes.",
    author: "Thomas Dubois",
    role: "Directeur Digital",
    company: "Optic 2000",
    industry: "Joaillerie",
  },
  {
    quote: "Nos clients adorent personnaliser leurs maillots en temps réel. Le ROI a été positif en 3 mois.",
    author: "Sophie Martin",
    role: "CEO",
    company: "TeamWear Pro",
    industry: "Sports",
  },
];

function IndustriesPageContent() {
  const [hoveredIndustry, setHoveredIndustry] = useState<string | null>(null);

  // Récupérer les données dynamiques depuis l'API
  const { industries: apiIndustries, loading: industriesLoading } = useAllIndustries();

  // Icon mapping pour les industries dynamiques
  const iconMap: Record<string, React.ReactNode> = useMemo(() => ({
    'Shirt': <Shirt className="w-8 h-8" />,
    'Sofa': <Sofa className="w-8 h-8" />,
    'Gem': <Gem className="w-8 h-8" />,
    'Car': <Car className="w-8 h-8" />,
    'Dumbbell': <Dumbbell className="w-8 h-8" />,
    'Printer': <Printer className="w-8 h-8" />,
    'Package': <Package className="w-8 h-8" />,
    'Smartphone': <Smartphone className="w-8 h-8" />,
    'Building': <Building className="w-8 h-8" />,
  }), []);

  // Gradient mapping pour les industries
  const gradientMap: Record<string, string> = useMemo(() => ({
    'fashion': 'from-pink-500 to-rose-600',
    'furniture': 'from-amber-500 to-orange-600',
    'jewelry': 'from-purple-500 to-violet-600',
    'automotive': 'from-blue-500 to-cyan-600',
    'sports': 'from-green-500 to-emerald-600',
    'printing': 'from-indigo-500 to-blue-600',
  }), []);

  // Fusionner les données dynamiques avec les statiques
  const dynamicIndustries = useMemo(() => {
    if (apiIndustries.length > 0) {
      return apiIndustries.map((ind) => ({
        id: ind.id,
        name: ind.name,
        subtitle: ind.tagline,
        description: ind.description,
        icon: iconMap[ind.icon] || <Building className="w-8 h-8" />,
        emoji: '🏭',
        color: 'text-purple-500',
        gradient: gradientMap[ind.id] || 'from-purple-500 to-violet-600',
        href: `/industries/${ind.slug}`,
        stats: {
          conversion: ind.stats[0]?.value || '+30%',
          returns: ind.stats[1]?.value || '-40%',
          engagement: ind.stats[2]?.value || 'x2.5',
        },
        useCases: ind.features.slice(0, 4).map(f => f.title),
        clients: [],
        featured: ind.id === 'fashion' || ind.id === 'jewelry',
      }));
    }
    return industries;
  }, [apiIndustries, iconMap, gradientMap]);

  // Featured industries
  const featuredIndustries = useMemo(() => 
    dynamicIndustries.filter(i => i.featured), 
    [dynamicIndustries]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Building className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">{industries.length} Industries Supportées</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Solutions par <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Industrie</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto">
              Luneo s&apos;adapte à votre secteur avec des fonctionnalités spécialisées.
              Personnalisation produit, configurateur 3D et essayage virtuel pour chaque industrie.
            </p>

            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              {globalStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Industries */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Industries Phares
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredIndustries.map((industry, index) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndustry(industry.id)}
                onMouseLeave={() => setHoveredIndustry(null)}
              >
                <Link href={industry.href}>
                  <Card className={`p-6 h-full bg-gradient-to-br ${industry.gradient} border-0 transition-all cursor-pointer ${
                    hoveredIndustry === industry.id ? 'scale-105 shadow-2xl' : 'shadow-lg'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white">
                        {industry.icon}
                      </div>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                        Featured
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">{industry.name}</h3>
                    <p className="text-white/80 text-sm mb-4">{industry.description}</p>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{industry.stats.conversion}</div>
                        <div className="text-xs text-white/60">Conversion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{industry.stats.returns}</div>
                        <div className="text-xs text-white/60">Retours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{industry.stats.engagement}</div>
                        <div className="text-xs text-white/60">Engagement</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-sm text-white/80">Découvrir</span>
                      <ChevronRight className={`w-5 h-5 text-white transition-transform ${
                        hoveredIndustry === industry.id ? 'translate-x-1' : ''
                      }`} />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Industries Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Toutes les <span className="text-purple-400">Industries</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Explorez nos solutions adaptées à chaque secteur
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicIndustries.map((industry, index) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={industry.href}>
                  <Card className="p-6 bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-all h-full group cursor-pointer">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${industry.gradient} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        {industry.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
                          {industry.name}
                        </h3>
                        <p className="text-sm text-slate-500">{industry.subtitle}</p>
                      </div>
                      <span className="text-2xl">{industry.emoji}</span>
                    </div>

                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {industry.description}
                    </p>

                    {/* Use Cases */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {industry.useCases.slice(0, 3).map((useCase, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                          {useCase}
                        </span>
                      ))}
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-800">
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-400">{industry.stats.conversion}</div>
                        <div className="text-xs text-slate-600">Conv.</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-cyan-400">{industry.stats.returns}</div>
                        <div className="text-xs text-slate-600">Retours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-400">{industry.stats.engagement}</div>
                        <div className="text-xs text-slate-600">Engage.</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-sm text-purple-400 font-medium group-hover:underline">
                        En savoir plus
                      </span>
                      <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Témoignages <span className="text-purple-400">Clients</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-900/80 border-slate-700 h-full relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-purple-500/20" />
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-white">{testimonial.author}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                    </div>
                    <span className="ml-auto px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">
                      {testimonial.industry}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-purple-950/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Votre industrie n&apos;est pas listée ?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Luneo s&apos;adapte à tous les secteurs. Contactez-nous pour discuter de vos besoins spécifiques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 text-lg">
                  Essai Gratuit 14 Jours
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Parler à un Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const MemoizedIndustriesPageContent = memo(IndustriesPageContent);

export default function IndustriesPage() {
  return (
    <ErrorBoundary level="page" componentName="IndustriesPage">
      <MemoizedIndustriesPageContent />
    </ErrorBoundary>
  );
}
