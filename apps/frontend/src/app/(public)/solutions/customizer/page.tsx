'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Layers,
  Download,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Share2,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Settings,
  RotateCw,
  Copy,
  Trash2,
  Play,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DemoCustomizer = dynamic(
  () => import('@/components/Customizer/ProductCustomizer').then((mod) => ({ default: mod.ProductCustomizer })),
  { ssr: false }
);

const toolColorStyles = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  green: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  pink: { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400' },
  cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
};

type ToolColor = keyof typeof toolColorStyles;

export default function CustomizerPage() {
  const [activeTool, setActiveTool] = useState<string>('text');
  const [canvasElements, setCanvasElements] = useState<number>(0);
  const [lastAddedElement, setLastAddedElement] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const demoProductImage =
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&auto=format&fit=crop&q=80';

  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Éditeur Visuel Puissant',
      description: 'Interface Konva.js intuitive pour personnaliser produits 2D en temps réel avec multi-layers.',
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: 'Texte Avancé',
      description: 'Polices Google Fonts, courbes Bézier, effets outline/shadow, transformation 3D.',
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Images & Cliparts',
      description: 'Upload photos, bibliothèque 10,000+ cliparts, filtres, masques, blend modes.',
    },
    {
      icon: <Square className="w-6 h-6" />,
      title: 'Formes Vectorielles',
      description: 'Rectangles, cercles, polygones, courbes Bézier, import SVG avec édition.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Layers Professionnel',
      description: 'Gestion layers Photoshop-style, groupes, lock, visibilité, ordre z-index.',
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Preview 3D Mockup',
      description: 'Aperçu temps réel sur mockup 3D T-shirt, mug, affiche, 50+ templates.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Print-Ready',
      description: 'PNG/PDF 300 DPI, CMYK conversion, bleed 3mm, crop marks pour imprimeurs.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Collaboration Temps Réel',
      description: 'Multi-users editing simultané avec WebSockets, cursors visibles, chat intégré.',
    },
  ];

  const tools: Array<{ id: string; name: string; icon: React.ReactNode; color: ToolColor }> = [
    { id: 'text', name: 'Texte', icon: <Type className="w-5 h-5" />, color: 'blue' },
    { id: 'image', name: 'Image', icon: <ImageIcon className="w-5 h-5" />, color: 'purple' },
    { id: 'shapes', name: 'Formes', icon: <Square className="w-5 h-5" />, color: 'green' },
    { id: 'clipart', name: 'Cliparts', icon: <Star className="w-5 h-5" />, color: 'orange' },
    { id: 'filter', name: 'Filtres', icon: <Sparkles className="w-5 h-5" />, color: 'pink' },
    { id: 'layers', name: 'Layers', icon: <Layers className="w-5 h-5" />, color: 'cyan' },
  ];

  const shapes = [
    { Icon: Square, name: 'Rectangle' },
    { Icon: Circle, name: 'Cercle' },
    { Icon: Triangle, name: 'Triangle' },
    { Icon: Star, name: 'Étoile' },
    { Icon: Heart, name: 'Coeur' },
  ];

  const exportFormats = [
    { format: 'PNG', dpi: '300 DPI', use: 'Web & Print' },
    { format: 'PDF', dpi: '300 DPI', use: 'Print Pro' },
    { format: 'SVG', dpi: 'Vector', use: 'Scalable' },
    { format: 'PDF/X-4', dpi: '300 DPI', use: 'Imprimeurs' },
  ];

  const benefits = [
    {
      title: 'Engagement',
      stat: 'x5',
      description: 'Temps sur site',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Conversions',
      stat: '+45%',
      description: 'Taux achat',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Panier',
      stat: '+32%',
      description: 'Valeur moyenne',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Retours',
      stat: '-48%',
      description: 'Moins erreurs',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '29',
      designs: '100',
      features: ['Éditeur basique', 'Texte + Images', 'Export PNG', 'Templates (10)', 'Support email'],
    },
    {
      name: 'Pro',
      price: '79',
      designs: '1000',
      features: ['Tout Starter +', 'Toutes formes + cliparts', 'Export PDF/SVG print', 'Templates (100)', 'Collaboration temps réel', 'Analytics', 'Support prioritaire'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      designs: 'Illimité',
      features: ['Tout Pro +', 'White-label complet', 'API custom', 'Intégration CRM/ERP', 'Workflow automation', 'SLA 99.99%', 'Support dédié 24/7'],
    },
  ];

  const handleAddElement = (type: string) => {
    setCanvasElements(prev => prev + 1);
    setLastAddedElement(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Visual Product Customizer</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Personnalisation Produits
              <br />
              Sans Limites
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Éditeur visuel professionnel avec texte, images, formes, cliparts.
              <br className="hidden sm:block" />
              <span className="text-purple-400 font-semibold">Export print 300 DPI</span> et{' '}
              <span className="text-pink-400 font-semibold">collaboration temps réel</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => setShowDemo(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg group"
              >
                <Play className="mr-2 w-5 h-5" />
                Lancer la démo interactive
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10 px-8 py-6 text-lg"
                >
                  Commencer Gratuitement
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${benefit.color} bg-clip-text text-transparent mb-2`}>
                    {benefit.stat}
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{benefit.title}</div>
                  <div className="text-xs text-gray-400">{benefit.description}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Canvas Demo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Éditeur Interactif
            </h2>
            <p className="text-xl text-gray-300">
              Cliquez sur les outils pour ajouter des éléments au canvas
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-purple-500/20 p-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Tools Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Outils
                </h3>
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        handleAddElement(tool.id);
                      }}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        activeTool === tool.id
                          ? `${toolColorStyles[tool.color].border} ${toolColorStyles[tool.color].bg}`
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className={toolColorStyles[tool.color].text}>{tool.icon}</div>
                      <span className="text-white font-medium text-sm">{tool.name}</span>
                    </button>
                  ))}
                </div>

                {/* Element Counter */}
                <Card className="bg-purple-500/10 border-purple-500/30 p-4 mt-6 space-y-1">
                  <p className="text-sm text-purple-400 font-medium">
                    Éléments sur canvas:{' '}
                    <span className="text-white font-bold">{canvasElements}</span>
                  </p>
                  {lastAddedElement && (
                    <p className="text-xs text-purple-200">
                      Dernier ajout : <span className="font-semibold">{lastAddedElement}</span>
                    </p>
                  )}
                </Card>
              </div>

              {/* Canvas Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="aspect-square bg-white rounded-lg border-2 border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  
                  {/* Demo elements */}
                  <div className="relative z-10 text-center p-8">
                    {canvasElements === 0 ? (
                      <>
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          Cliquez sur un outil pour commencer
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Canvas 800x800px
                        </p>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        {activeTool === 'text' && (
                          <p className="text-4xl font-bold text-purple-600">
                            Votre Texte
                          </p>
                        )}
                        {activeTool === 'image' && (
                          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mx-auto" />
                        )}
                        {activeTool === 'shapes' && (
                          <div className="w-32 h-32 bg-blue-500 rounded-full mx-auto" />
                        )}
                        {activeTool === 'clipart' && (
                          <Star className="w-32 h-32 text-orange-500 mx-auto" />
                        )}
                        <p className="text-sm text-gray-600">
                          Élément ajouté !
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Canvas Controls */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                      <RotateCw className="w-4 h-4 text-gray-700" />
                    </button>
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                      <Copy className="w-4 h-4 text-gray-700" />
                    </button>
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="border-purple-500/50 hover:bg-purple-500/10"
                  >
                    <Eye className="mr-2 w-4 h-4" />
                    Preview 3D
                  </Button>
                  <Button
                    variant="outline"
                    className="border-pink-500/50 hover:bg-pink-500/10"
                  >
                    <Download className="mr-2 w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <Share2 className="mr-2 w-4 h-4" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Properties Panel */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  Propriétés
                </h3>

                {activeTool === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">Police</label>
                      <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                        <option>Arial</option>
                        <option>Helvetica</option>
                        <option>Georgia</option>
                        <option>Courier</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">Taille (px)</label>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        defaultValue="48"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">Couleur</label>
                      <input
                        type="color"
                        defaultValue="#A855F7"
                        className="w-full h-10 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {activeTool === 'shapes' && (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 block mb-2">Type de forme:</label>
                    {shapes.map((shape, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddElement('shape')}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500/50 transition-all flex items-center gap-3"
                      >
                        <shape.Icon className="w-5 h-5 text-green-400" />
                        <span className="text-white text-sm">{shape.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTool === 'layers' && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block mb-2">Layers (3):</label>
                    {['Background', 'Texte principal', 'Clipart star'].map((layer, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-white text-sm">{layer}</span>
                        <div className="flex gap-2">
                          <button className="text-gray-400 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Formats */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Formats d&apos;Export
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {exportFormats.map((format, i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700 p-4 text-center">
                    <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="font-semibold text-white">{format.format}</p>
                    <p className="text-xs text-gray-400 mb-1">{format.dpi}</p>
                    <p className="text-xs text-purple-400">{format.use}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Fonctionnalités Complètes
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour personnaliser produits professionnellement
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-purple-500/20 p-6 h-full hover:border-purple-500/50 hover:bg-gray-900/70 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-purple-400">{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Print Automation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Export Print Professionnel
            </h2>
            <p className="text-xl text-gray-300">
              Fichiers prêts pour impression avec standards professionnels
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-purple-500/20 p-8">
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Download className="w-6 h-6 text-purple-400" />
                Spécifications Print
              </h3>
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">300 DPI (Print Quality)</p>
                    <p className="text-gray-400">Résolution professionnelle pour impression offset</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">CMYK Conversion</p>
                    <p className="text-gray-400">Couleurs optimisées pour imprimantes industrielles</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Bleed + Crop Marks</p>
                    <p className="text-gray-400">Marges perdues 3mm et repères de coupe automatiques</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">PDF/X-4 Standard</p>
                    <p className="text-gray-400">Format universel accepté par tous imprimeurs</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-pink-500/20 p-8">
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-pink-400" />
                Workflow Automatisé
              </h3>
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Print-on-Demand</p>
                    <p className="text-gray-400">Envoi auto aux POD providers (Printful, Printify)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Webhooks</p>
                    <p className="text-gray-400">Notifications temps réel design créé/modifié</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Batch Export</p>
                    <p className="text-gray-400">Exportez 100+ designs simultanément</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Versioning</p>
                    <p className="text-gray-400">Historique designs avec rollback</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Pourquoi Choisir Luneo ?
            </h2>
            <p className="text-xl text-gray-300">
              Comparaison avec Zakeke Visual Customizer
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-purple-500/20 p-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                  <th className="pb-4 text-gray-400 font-semibold">Zakeke Customizer</th>
                  <th className="pb-4 text-purple-400 font-semibold">Luneo Customizer</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Canvas Engine</td>
                  <td className="py-4 text-gray-400">Non spécifié</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Konva.js professionnel
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Outils</td>
                  <td className="py-4 text-gray-400">Texte, Images</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ + Formes, Cliparts, Filtres, Layers
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Collaboration</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Real-time multi-users (WebSockets)
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Versioning</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Historique complet + rollback
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Export Print</td>
                  <td className="py-4 text-gray-400">PDF basique</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ PDF/X-4 + CMYK + Bleed + Crop marks
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Preview 3D</td>
                  <td className="py-4 text-gray-400">Basique</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Real-time 3D mockup (50+ templates)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-gray-300">Prix</td>
                  <td className="py-4 text-gray-400">Custom quote</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ $79/mois (Pro plan transparent)
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-gray-300">
              Plans flexibles pour toutes tailles d&apos;entreprise
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-8 h-full ${
                    plan.popular
                      ? 'bg-gradient-to-b from-purple-900/30 to-pink-900/30 border-purple-500'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-semibold mb-4">
                      POPULAIRE
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 'Custom' ? '' : '$'}
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-400">/mois</span>
                    )}
                  </div>
                  <div className="space-y-2 mb-6 text-sm">
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">
                        {plan.designs}
                      </span>{' '}
                      designs/mois
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price === 'Custom' ? '/contact' : '/auth/register'}>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {plan.price === 'Custom' ? 'Contactez-nous' : 'Commencer'}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Intégration Simple
            </h2>
            <p className="text-xl text-gray-300">
              Embed le customizer sur votre site en 2 minutes
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-purple-500/20 p-8">
            <div className="bg-black/50 rounded-lg p-6 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{`<!-- Embed iframe -->
<iframe
  src="https://app.luneo.app/customizer?product=tshirt"
  width="100%"
  height="800"
  frameborder="0"
></iframe>

<!-- Ou SDK JavaScript -->
<script src="https://cdn.luneo.app/customizer.js"></script>

<div id="customizer"></div>

<script>
  const customizer = new LuneoCustomizer({
    container: '#customizer',
    productType: 'tshirt',
    tools: ['text', 'image', 'shapes', 'cliparts'],
    export: {
      format: 'pdf',
      dpi: 300,
      cmyk: true,
      bleed: 3 // mm
    },
    onSave: async (design) => {
      // Send to your backend
      await fetch('/api/designs', {
        method: 'POST',
        body: JSON.stringify(design)
      });
    }
  });
</script>`}</pre>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-purple-900/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Lancez Votre Customizer Aujourd&apos;hui
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Des milliers d&apos;entreprises font confiance à Luneo pour leur
              personnalisation produits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo/customizer">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg group"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Voir Démo Interactive
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10 px-8 py-6 text-lg"
                >
                  Parler à un Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Questions Fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Quels types de produits puis-je personnaliser ?
              </h3>
              <p className="text-gray-400">
                T-shirts, mugs, affiches, cartes de visite, stickers, coques téléphone, tote bags, 
                et 50+ autres produits. Ou ajoutez vos propres templates avec notre éditeur.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Mes clients peuvent-ils uploader leurs propres images ?
              </h3>
              <p className="text-gray-400">
                Oui ! Upload illimité d&apos;images avec validation automatique (format, taille, résolution). 
                Nous optimisons les images pour impression (300 DPI) automatiquement.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment fonctionne la collaboration temps réel ?
              </h3>
              <p className="text-gray-400">
                WebSockets pour sync instantanée. Plusieurs utilisateurs peuvent éditer le même design 
                simultanément, voir les cursors des autres, et chatter. Parfait pour équipes design.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                L&apos;export print est-il vraiment pro ?
              </h3>
              <p className="text-gray-400">
                Oui ! PDF/X-4 standard avec CMYK, 300 DPI, bleed 3mm, crop marks. Accepté par tous 
                les imprimeurs professionnels. Nous avons des centaines de clients POD qui l&apos;utilisent.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Essai Gratuit 14 Jours
          </h2>
          <p className="text-gray-300 mb-6">
            Aucune carte requise · Tous features Pro inclus · Support premium
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
            >
              Créer un Compte Gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
      {showDemo && (
        <DemoCustomizer
          productId="demo-product"
          productImage={demoProductImage}
          productName="T-shirt Premium"
          mode="demo"
          onClose={() => setShowDemo(false)}
        />
      )}
    </div>
  );
}
