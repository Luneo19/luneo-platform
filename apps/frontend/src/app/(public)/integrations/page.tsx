'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plug,
  ShoppingBag,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  CreditCard,
  Package,
  Code,
  Webhook,
  BarChart3,
  Shield,
  Clock,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Integration type definition
interface Integration {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  color: string;
  gradient: string;
  category: 'ecommerce' | 'payment' | 'pod' | 'automation' | 'api';
  href: string;
  features: string[];
  popular?: boolean;
  new?: boolean;
  stats?: {
    users: string;
    rating: number;
  };
}

// All integrations data
const integrations: Integration[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Intégration native avec le leader mondial du e-commerce',
    longDescription: 'Ajoutez la personnalisation 3D/AR à votre boutique Shopify en 1 clic. Synchronisation automatique des produits, commandes et inventaire.',
    icon: '🛍️',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-600',
    category: 'ecommerce',
    href: '/integrations/shopify',
    features: ['Installation 1-clic', 'Sync inventaire', 'Widget personnalisation', 'AR Try-On'],
    popular: true,
    stats: { users: '2,500+', rating: 4.9 },
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Plugin WordPress pour votre boutique WooCommerce',
    longDescription: 'Plugin officiel pour WooCommerce. Personnalisation produits, configurateur 3D et essayage virtuel intégrés à votre site WordPress.',
    icon: '🔌',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-600',
    category: 'ecommerce',
    href: '/integrations/woocommerce',
    features: ['Plugin WordPress', 'Shortcodes', 'Gutenberg blocks', 'REST API'],
    popular: true,
    stats: { users: '1,800+', rating: 4.8 },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements sécurisés et gestion des abonnements',
    longDescription: 'Intégration complète avec Stripe pour les paiements en ligne, la gestion des abonnements et la facturation automatique.',
    icon: '💳',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-blue-600',
    category: 'payment',
    href: '/integrations/stripe',
    features: ['Checkout sécurisé', 'Abonnements', 'Facturation', 'Webhooks'],
    stats: { users: '3,200+', rating: 4.9 },
  },
  {
    id: 'printful',
    name: 'Printful',
    description: 'Print-on-demand automatisé avec Printful',
    longDescription: 'Connectez Luneo à Printful pour automatiser la production et l\'expédition de vos produits personnalisés. Export print-ready 300 DPI.',
    icon: '🖨️',
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-red-500',
    category: 'pod',
    href: '/integrations/printful',
    features: ['Export 300 DPI', 'Mockups auto', 'Fulfillment', 'Tracking'],
    popular: true,
    stats: { users: '1,500+', rating: 4.7 },
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connectez Luneo à 5000+ applications',
    longDescription: 'Automatisez vos workflows avec Zapier. Connectez Luneo à vos CRM, outils marketing, gestion de projet et plus encore.',
    icon: '⚡',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    category: 'automation',
    href: '/integrations/zapier',
    features: ['5000+ apps', 'Triggers', 'Actions', 'Multi-step Zaps'],
    new: true,
    stats: { users: '800+', rating: 4.6 },
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Automatisations visuelles avancées',
    longDescription: 'Créez des automatisations complexes avec Make (ex-Integromat). Interface visuelle drag & drop pour des workflows puissants.',
    icon: '🔧',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-teal-500',
    category: 'automation',
    href: '/integrations/make',
    features: ['Visual builder', 'Scénarios', 'HTTP/Webhooks', 'Data stores'],
    new: true,
    stats: { users: '500+', rating: 4.5 },
  },
];

// Categories
const categories = [
  { id: 'all', label: 'Toutes', icon: <Globe className="w-4 h-4" /> },
  { id: 'ecommerce', label: 'E-commerce', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'payment', label: 'Paiement', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'pod', label: 'Print-on-Demand', icon: <Package className="w-4 h-4" /> },
  { id: 'automation', label: 'Automatisation', icon: <Zap className="w-4 h-4" /> },
];

// Benefits
const benefits = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Installation rapide',
    description: 'La plupart des intégrations s\'installent en moins de 5 minutes',
    stat: '< 5 min',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Synchronisation temps réel',
    description: 'Données synchronisées automatiquement via webhooks',
    stat: 'Real-time',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Sécurité maximale',
    description: 'OAuth 2.0, chiffrement AES-256, certifié SOC 2',
    stat: 'SOC 2',
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: 'API complète',
    description: 'API RESTful documentée pour intégrations custom',
    stat: 'REST API',
  },
];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)',
                'radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)',
                'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Plug className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">{integrations.length} Intégrations Disponibles</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Connectez <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Luneo</span>
              <br />
              à vos outils préférés
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto">
              Intégrations natives avec les plateformes e-commerce, paiement et automatisation les plus populaires.
              Installation en quelques clics, synchronisation en temps réel.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-12">
              {[
                { value: '10,000+', label: 'Marchands connectés' },
                { value: '99.9%', label: 'Uptime garanti' },
                { value: '< 2h', label: 'Support réponse' },
                { value: '4.8/5', label: 'Note moyenne' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher une intégration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <Link href="/docs/api">
                <Button variant="outline" className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 whitespace-nowrap">
                  <Code className="w-4 h-4 mr-2" />
                  API Docs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-cyan-400">
                  {benefit.icon}
                </div>
                <div className="text-lg font-bold text-white mb-1">{benefit.stat}</div>
                <h3 className="font-medium text-white text-sm">{benefit.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {category.icon}
                {category.label}
              </button>
            ))}
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={integration.href}>
                  <Card className="p-6 bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all h-full group cursor-pointer">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${integration.gradient} rounded-xl flex items-center justify-center text-2xl`}>
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">
                            {integration.name}
                          </h3>
                          {integration.stats && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-slate-400">{integration.stats.rating}</span>
                              </div>
                              <span className="text-xs text-slate-600">•</span>
                              <span className="text-xs text-slate-400">{integration.stats.users} utilisateurs</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {integration.popular && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Populaire</span>
                        )}
                        {integration.new && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Nouveau</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {integration.longDescription}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {integration.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                          {feature}
                        </span>
                      ))}
                      {integration.features.length > 3 && (
                        <span className="px-2 py-1 bg-slate-800 text-slate-500 text-xs rounded-md">
                          +{integration.features.length - 3}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-sm text-cyan-400 font-medium group-hover:underline">
                        Voir l&apos;intégration
                      </span>
                      <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* No results */}
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Aucune intégration trouvée</h3>
              <p className="text-slate-400 mb-4">Essayez avec d&apos;autres termes de recherche</p>
              <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">API RESTful</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Besoin d&apos;une intégration <span className="text-purple-400">custom</span> ?
              </h2>
              <p className="text-lg text-slate-400 mb-6">
                Notre API RESTful complète vous permet de créer des intégrations sur-mesure pour vos besoins spécifiques.
                Documentation détaillée, SDKs et support dédié.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'API RESTful documentée avec OpenAPI 3.0',
                  'SDKs officiels : JavaScript, Python, PHP, Ruby',
                  'Webhooks pour synchronisation temps réel',
                  'Sandbox pour tests et développement',
                  'Rate limits généreux (10,000 req/min)',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href="/docs/api">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Code className="w-4 h-4 mr-2" />
                    Documentation API
                  </Button>
                </Link>
                <Link href="/demo/api-playground">
                  <Button variant="outline" className="border-slate-600 hover:bg-slate-800">
                    <Sparkles className="w-4 h-4 mr-2" />
                    API Playground
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-950 border-slate-700 p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-sm text-slate-500">api-example.js</span>
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code className="text-slate-300">{`import Luneo from '@luneo/sdk';

const client = new Luneo({
  apiKey: process.env.LUNEO_API_KEY
});

// Create a customization
const design = await client.designs.create({
  productId: 'prod_123',
  template: 'tshirt-front',
  layers: [{
    type: 'text',
    content: 'Hello World',
    position: { x: 100, y: 200 },
    style: { font: 'Inter', size: 24 }
  }]
});

// Generate print-ready files
const files = await client.designs.export(design.id, {
  format: 'pdf',
  dpi: 300,
  bleed: true
});

console.log(files.url);`}</code>
                </pre>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-cyan-950/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Plug className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prêt à connecter Luneo ?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Commencez gratuitement et connectez vos outils en quelques minutes.
              Support disponible 7j/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-8 py-6 text-lg">
                  Commencer Gratuitement
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
            <p className="text-sm text-slate-500 mt-6">
              Aucune carte de crédit requise • Essai gratuit 14 jours • Support inclus
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
