'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Box,
  Rotate3D,
  Download,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Camera,
  Share2,
  Layers,
  Palette,
  Type,
  Maximize,
  Play,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Configurator3DPage() {
  const [activeConfig, setActiveConfig] = useState<string>('color');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('metal');
  const [rotate, setRotate] = useState(false);

  const features = [
    {
      icon: <Box className="w-6 h-6" />,
      title: 'Modèles 3D Réalistes',
      description: 'Rendu Three.js avec PBR materials, metalness, roughness, normal maps pour réalisme photo.',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Configurations Illimitées',
      description: 'Couleurs, matériaux, textures, gravures, options infinies avec règles CPQ avancées.',
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: 'Gravure 3D Texte',
      description: 'Ajoutez du texte gravé en 3D avec extrusion, profondeur variable, polices custom.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Exploded View',
      description: 'Animations d&apos;éclatement pour visualiser chaque pièce séparément avec labels.',
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'AR Preview',
      description: 'Visualisez en AR avec export USDZ (iOS) et GLB (Android) pour voir chez vous.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Production',
      description: 'GLB, USDZ, FBX optimisés + PDF print-ready 4K/8K 300 DPI pour fabrication.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Dynamic Pricing',
      description: 'Prix calculé en temps réel selon options choisies avec règles métier complexes.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Partage Configuration',
      description: 'URL unique par config, partage sur réseaux sociaux, embed iframe anywhere.',
    },
  ];

  const materials = [
    { id: 'metal', name: 'Métal Brossé', color: '#C0C0C0', roughness: 0.3, metalness: 1.0 },
    { id: 'gold', name: 'Or 18K', color: '#FFD700', roughness: 0.2, metalness: 1.0 },
    { id: 'wood', name: 'Bois Chêne', color: '#8B4513', roughness: 0.8, metalness: 0.0 },
    { id: 'leather', name: 'Cuir', color: '#654321', roughness: 0.9, metalness: 0.0 },
    { id: 'carbon', name: 'Fibre Carbone', color: '#1a1a1a', roughness: 0.1, metalness: 0.8 },
    { id: 'glass', name: 'Verre', color: '#ffffff', roughness: 0.0, metalness: 0.0 },
  ];

  const configOptions = [
    {
      id: 'color',
      name: 'Couleurs',
      icon: <Palette className="w-5 h-5" />,
      count: '100+',
    },
    {
      id: 'material',
      name: 'Matériaux',
      icon: <Layers className="w-5 h-5" />,
      count: '20+',
    },
    {
      id: 'text',
      name: 'Gravure 3D',
      icon: <Type className="w-5 h-5" />,
      count: 'Illimité',
    },
    {
      id: 'size',
      name: 'Dimensions',
      icon: <Maximize className="w-5 h-5" />,
      count: 'Custom',
    },
  ];

  const benefits = [
    {
      title: 'Conversions',
      stat: '+35%',
      description: 'Augmentation achats',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Engagement',
      stat: 'x4',
      description: 'Temps sur produit',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Panier moyen',
      stat: '+28%',
      description: 'Valeur commande',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Retours',
      stat: '-55%',
      description: 'Moins de retours',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const useCases = [
    {
      title: 'Meubles',
      icon: '🛋️',
      description: 'Sofas, chaises, tables',
      examples: 'Couleurs tissus, bois, dimensions',
    },
    {
      title: 'Bijoux',
      icon: '💍',
      description: 'Bagues, colliers, montres',
      examples: 'Gravure nom, pierres, métaux',
    },
    {
      title: 'Véhicules',
      icon: '🚗',
      description: 'Auto, moto, vélo',
      examples: 'Couleur carrosserie, jantes, options',
    },
    {
      title: 'Équipement',
      icon: '⚙️',
      description: 'Machines, outils',
      examples: 'Configurations, modules, specs',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '29',
      configs: '100',
      features: ['3D viewer basique', '10 couleurs', 'Export GLB', 'Support email'],
    },
    {
      name: 'Pro',
      price: '79',
      configs: '1000',
      features: ['Tout Starter +', 'PBR materials', 'Gravure 3D texte', 'Export USDZ+FBX', 'Dynamic pricing', 'Analytics', 'Support prioritaire'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      configs: 'Illimité',
      features: ['Tout Pro +', 'CPQ avancé', 'Exploded view', 'White-label', 'Export 4K/8K print', 'API custom', 'Account manager'],
    },
  ];

  const techSpecs = [
    {
      category: 'Rendering',
      specs: [
        { name: 'Engine', value: 'Three.js r160' },
        { name: 'Materials', value: 'PBR (Physical Based)' },
        { name: 'Lights', value: 'IBL + Directional + Ambient' },
        { name: 'Shadows', value: 'PCF soft shadows' },
      ],
    },
    {
      category: 'Performance',
      specs: [
        { name: 'FPS', value: '60 FPS (desktop) / 30 FPS (mobile)' },
        { name: 'Load Time', value: '< 2s (modèle 10MB)' },
        { name: 'Polygons', value: 'Jusqu\'à 500k (LODs auto)' },
        { name: 'Textures', value: '4K PBR (compressed)' },
      ],
    },
    {
      category: 'Export',
      specs: [
        { name: 'Web', value: 'GLB, GLTF' },
        { name: 'AR', value: 'USDZ (iOS), GLB (Android)' },
        { name: 'Gaming', value: 'FBX, OBJ' },
        { name: 'Print', value: 'PNG/PDF 4K-8K 300 DPI' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Box className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">3D Product Configurator</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Configurateur 3D
              <br />
              Nouvelle Génération
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Permettez à vos clients de configurer produits en 3D temps réel.
              <br className="hidden sm:block" />
              <span className="text-blue-400 font-semibold">PBR materials</span>,{' '}
              <span className="text-purple-400 font-semibold">gravure 3D</span>, et{' '}
              <span className="text-pink-400 font-semibold">export production</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <Button
                onClick={() => {
                  const anchor = document.getElementById('interactive-3d-demo');
                  anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
              >
                <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Voir Démo Interactive</span>
                <span className="sm:hidden">Voir Démo</span>
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-500/50 hover:bg-blue-500/10 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
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

      {/* Interactive 3D Demo */}
      <section id="interactive-3d-demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Configurateur Interactif
            </h2>
            <p className="text-xl text-gray-300">
              Personnalisez en temps réel avec aperçu 3D instantané
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-blue-500/20 p-4 sm:p-6 md:p-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* 3D Viewer */}
              <div className="space-y-6">
                <div className="aspect-square bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border-2 border-blue-500/30 flex items-center justify-center relative overflow-hidden">
                  <motion.div
                    animate={{ rotateY: rotate ? 360 : 0 }}
                    transition={{ duration: 3, repeat: rotate ? Infinity : 0, ease: 'linear' }}
                    className="w-48 h-48 relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg transform rotate-12" />
                    <div className="absolute inset-2 bg-gray-900 rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Box className="w-24 h-24 text-blue-400" />
                    </div>
                  </motion.div>

                  {/* Material badge */}
                  <div className="absolute top-4 left-4 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 px-4 py-2 rounded-lg">
                    <p className="text-sm text-blue-400 font-medium">
                      Matériau: {materials.find(m => m.id === selectedMaterial)?.name}
                    </p>
                  </div>

                  {/* Controls overlay */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={() => setRotate(!rotate)}
                      className="w-10 h-10 bg-black/50 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <Rotate3D className="w-5 h-5 text-blue-400" />
                    </button>
                    <button className="w-10 h-10 bg-black/50 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors">
                      <Maximize className="w-5 h-5 text-blue-400" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    className="border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <Camera className="mr-2 w-4 h-4" />
                    Voir en AR
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-500/50 hover:bg-purple-500/10"
                  >
                    <Download className="mr-2 w-4 h-4" />
                    Exporter
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-500/50 hover:bg-green-500/10"
                  >
                    <Share2 className="mr-2 w-4 h-4" />
                    Partager
                  </Button>
                  <Button
                    variant="outline"
                    className="border-pink-500/50 hover:bg-pink-500/10"
                  >
                    <ShoppingCart className="mr-2 w-4 h-4" />
                    Ajouter panier
                  </Button>
                </div>
              </div>

              {/* Configuration Panel */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-blue-400" />
                  Options de Configuration
                </h3>

                {/* Config Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {configOptions.map((option) => (
                    <Card
                      key={option.id}
                      onClick={() => setActiveConfig(option.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        activeConfig === option.id
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400">{option.icon}</div>
                        <div className="text-left">
                          <p className="font-semibold text-white text-sm">
                            {option.name}
                          </p>
                          <p className="text-xs text-gray-400">{option.count}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Material Selection */}
                {activeConfig === 'material' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-gray-400">
                      Choisissez un Matériau:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          onClick={() => setSelectedMaterial(material.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedMaterial === material.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 hover:border-blue-500/50'
                          }`}
                        >
                          <div
                            className="w-full aspect-square rounded-lg mb-2"
                            style={{ backgroundColor: material.color }}
                          />
                          <p className="text-xs text-white font-medium text-center">
                            {material.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Color Selection */}
                {activeConfig === 'color' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-gray-400">
                      100+ Couleurs Disponibles:
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
                        '#FFC0CB', '#A52A2A', '#DEB887', '#5F9EA0', '#7FFF00', '#D2691E', '#FF7F50', '#6495ED'].map((color, i) => (
                        <button
                          key={i}
                          className="w-full aspect-square rounded-lg border-2 border-gray-700 hover:border-blue-500 hover:scale-110 transition-all"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Text Engraving */}
                {activeConfig === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-semibold text-gray-400">
                      Gravure 3D Personnalisée:
                    </h4>
                    <input
                      type="text"
                      placeholder="Entrez votre texte..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Police</label>
                        <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                          <option>Arial</option>
                          <option>Helvetica</option>
                          <option>Times New Roman</option>
                          <option>Courier</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Profondeur</label>
                        <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                          <option>Shallow (0.5mm)</option>
                          <option>Medium (1mm)</option>
                          <option>Deep (2mm)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Dimensions */}
                {activeConfig === 'size' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-semibold text-gray-400">
                      Dimensions Personnalisées:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Largeur (cm)</label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          defaultValue="100"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Hauteur (cm)</label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          defaultValue="100"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Profondeur (cm)</label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          defaultValue="50"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Price Display */}
                <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Prix configuré:</span>
                    <span className="text-2xl font-bold text-green-400">€1,299</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Prix calculé dynamiquement selon options
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Fonctionnalités Avancées
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              CPQ professionnel avec rendu 3D temps réel et export production
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
                <Card className="bg-gray-900/50 border-blue-500/20 p-6 h-full hover:border-blue-500/50 hover:bg-gray-900/70 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-blue-400">{feature.icon}</div>
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

      {/* Use Cases */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Industries Couvertes
            </h2>
            <p className="text-xl text-gray-300">
              Configurateur adapté à tous types de produits complexes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-blue-500/20 p-6 text-center hover:border-blue-500/50 transition-all">
                  <div className="text-6xl mb-4">{useCase.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {useCase.description}
                  </p>
                  <p className="text-xs text-blue-400">
                    {useCase.examples}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Spécifications Techniques
            </h2>
            <p className="text-xl text-gray-300">
              Performance et qualité professionnelle
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techSpecs.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-blue-500/20 p-6 h-full">
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {section.category}
                  </h3>
                  <div className="space-y-3">
                    {section.specs.map((spec, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 text-sm">
                        <span className="text-gray-400">{spec.name}:</span>
                        <span className="text-white font-medium text-right">
                          {spec.value}
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

      {/* Comparison Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Luneo vs Zakeke
            </h2>
            <p className="text-xl text-gray-300">
              Notre configurateur 3D est techniquement supérieur
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-blue-500/20 p-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                  <th className="pb-4 text-gray-400 font-semibold">Zakeke 3D Config</th>
                  <th className="pb-4 text-blue-400 font-semibold">Luneo 3D Config</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Rendu 3D</td>
                  <td className="py-4 text-gray-400">Standard WebGL</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Three.js + PBR materials
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Gravure 3D Texte</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Extrusion 3D avec profondeur variable
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Exploded View</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Animations éclatement avec labels
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Export Production</td>
                  <td className="py-4 text-gray-400">GLB basique</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ GLB + USDZ + FBX + Print 4K/8K
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">CPQ Engine</td>
                  <td className="py-4 text-gray-400">Dynamic pricing basique</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Règles avancées + quotes complexes
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Performance</td>
                  <td className="py-4 text-gray-400">Non spécifié</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 60 FPS desktop / 30 FPS mobile
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-gray-300">Prix (Pro)</td>
                  <td className="py-4 text-gray-400">Custom quote</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ $79/mois (transparent)
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Tarifs Simples
            </h2>
            <p className="text-xl text-gray-300">
              Pas de frais cachés, scaling transparent
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
                      ? 'bg-gradient-to-b from-blue-900/30 to-purple-900/30 border-blue-500'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-semibold mb-4">
                      RECOMMANDÉ
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
                        {plan.configs}
                      </span>{' '}
                      configurations/mois
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
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
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

      {/* Integration Code */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Intégration Simple
            </h2>
            <p className="text-xl text-gray-300">
              3 lignes de code pour un configurateur 3D complet
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-blue-500/20 p-8">
            <div className="bg-black/50 rounded-lg p-6 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{`import { Configurator3D } from '@luneo/optimization';

// Initialize configurator
const config = new Configurator3D({
  container: '#configurator',
  modelUrl: '/models/product.glb',
  options: {
    materials: {
      metal: { color: '#C0C0C0', metalness: 1.0, roughness: 0.3 },
      gold: { color: '#FFD700', metalness: 1.0, roughness: 0.2 },
      wood: { color: '#8B4513', metalness: 0.0, roughness: 0.8 }
    },
    engraving: {
      enabled: true,
      fonts: ['Arial', 'Helvetica', 'Times'],
      depth: [0.5, 1.0, 2.0]
    },
    explodedView: {
      enabled: true,
      animationSpeed: 1.0
    }
  }
});

// Configure product
config.setMaterial('gold');
config.engraveText('John Doe', { font: 'Arial', depth: 1.0 });
config.setDimensions({ width: 100, height: 80, depth: 50 });

// Export for production
const glb = await config.exportGLB();
const usdz = await config.exportUSDZ();
const print = await config.exportPrintReady({ dpi: 300, format: 'png' });

// Dynamic pricing
const price = config.calculatePrice();
console.log('Prix configuré:', price); // €1,299`}</pre>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-blue-900/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Prêt à Configurer en 3D ?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Offrez à vos clients une expérience de configuration unique
              avec notre configurateur 3D nouvelle génération.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  const anchor = document.getElementById('interactive-3d-demo');
                  anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg group"
              >
                <Play className="mr-2 w-5 h-5" />
                Essayer la Démo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-500/50 hover:bg-blue-500/10 px-8 py-6 text-lg"
                >
                  Démo Personnalisée
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
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
                Quelle est la différence avec un configurateur 2D ?
              </h3>
              <p className="text-gray-400">
                Le configurateur 3D permet de visualiser le produit sous tous les angles en temps réel, 
                avec rendu photoréaliste PBR. Les clients comprennent exactement ce qu&apos;ils achètent, 
                ce qui augmente conversions de +35% en moyenne.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment fonctionne la gravure 3D ?
              </h3>
              <p className="text-gray-400">
                Le texte est gravé directement dans le modèle 3D avec extrusion et profondeur variable. 
                Visible en temps réel dans le viewer, et exporté dans tous les formats (GLB, USDZ, FBX).
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Puis-je exporter pour fabrication ?
              </h3>
              <p className="text-gray-400">
                Oui ! Export print-ready 4K/8K à 300 DPI (PNG/PDF) pour impression, et export 3D (FBX, OBJ) 
                pour CNC, impression 3D, ou envoi direct à vos fabricants.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Le configurateur fonctionne sur mobile ?
              </h3>
              <p className="text-gray-400">
                Oui, optimisé pour mobile avec LODs adaptatifs et textures compressées. 
                30 FPS garanti sur smartphone moderne, et export AR natif (USDZ/GLB).
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Démarrez Aujourd&apos;hui
          </h2>
          <p className="text-gray-300 mb-6">
            Essai gratuit 14 jours · Aucune carte requise · Support 24/7
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4"
            >
              Créer un Compte Gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
