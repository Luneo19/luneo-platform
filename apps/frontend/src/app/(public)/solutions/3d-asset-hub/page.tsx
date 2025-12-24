'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Database,
  Upload,
  Download,
  Zap,
  Settings,
  FileType,
  Layers,
  Package,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Cloud,
  Cpu,
  Gauge,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AssetHubPage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Upload Multi-Format',
      description: 'Importez GLB, FBX, OBJ, GLTF, USD, STL, 3DS, COLLADA, et plus. Support drag & drop.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Optimisation Automatique',
      description: 'Compression textures, réduction polygones, génération LODs automatique.',
    },
    {
      icon: <FileType className="w-6 h-6" />,
      title: 'Conversion 15+ Formats',
      description: 'Convertissez entre USDZ, GLB, FBX, OBJ, STL, et tous les formats 3D majeurs.',
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'AI Mesh Simplification',
      description: 'Réduction intelligente des polygones avec préservation des détails visuels.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'LOD Auto-Generation',
      description: 'Créez 4 niveaux de détail (LOD0-LOD3) automatiquement pour performance optimale.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Deploy Universel',
      description: 'Exportez pour Web, AR (iOS/Android), VR, Unity, Unreal Engine en 1 clic.',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Batch Processing',
      description: 'Traitez 1000+ assets simultanément avec BullMQ et Redis pour scaling massif.',
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'CDN Multi-Région',
      description: 'Distribution Cloudflare + Vercel avec edge caching pour latence ultra-faible.',
    },
  ];

  const formats = {
    input: ['GLB', 'FBX', 'OBJ', 'GLTF', 'USD', 'USDZ', 'STL', '3DS', 'COLLADA', 'PLY', 'X3D', 'DAE'],
    output: ['GLB', 'USDZ', 'FBX', 'OBJ', 'STL', 'GLTF', 'GLB Draco', 'GLTF Binary'],
  };

  const optimizations = [
    {
      title: 'Mesh Optimization',
      description: 'Réduction intelligente des polygones',
      reduction: '50-90%',
    },
    {
      title: 'Texture Compression',
      description: 'WebP, AVIF, Basis Universal',
      reduction: '70-95%',
    },
    {
      title: 'LOD Generation',
      description: '4 niveaux de détail automatiques',
      reduction: 'Adaptive',
    },
    {
      title: 'Geometry Cleanup',
      description: 'Suppression doublons, normals, UVs',
      reduction: '10-30%',
    },
  ];

  const deployTargets = [
    { name: 'Web (Three.js)', icon: <Globe className="w-5 h-5" /> },
    { name: 'iOS AR (USDZ)', icon: <Sparkles className="w-5 h-5" /> },
    { name: 'Android AR (GLB)', icon: <Sparkles className="w-5 h-5" /> },
    { name: 'Unity', icon: <Package className="w-5 h-5" /> },
    { name: 'Unreal Engine', icon: <Package className="w-5 h-5" /> },
    { name: 'WebXR', icon: <Globe className="w-5 h-5" /> },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '29',
      assets: '100',
      bandwidth: '10 GB',
      features: ['Upload illimité', 'Optimisation basique', '2 formats export', 'Support email'],
    },
    {
      name: 'Pro',
      price: '79',
      assets: '1000',
      bandwidth: '100 GB',
      features: ['Tout Starter +', 'AI Optimization', 'Tous formats export', 'Batch processing', 'Support prioritaire'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      assets: 'Illimité',
      bandwidth: 'Illimité',
      features: ['Tout Pro +', 'White-label', 'CDN privé', 'SLA 99.99%', 'Support dédié 24/7'],
    },
  ];

  const stats = [
    { value: '15+', label: 'Formats Supportés' },
    { value: '1000+', label: 'Assets/Heure' },
    { value: '90%', label: 'Réduction Taille' },
    { value: '< 2s', label: 'Temps Traitement' },
  ];

  // Simulate upload for demo
  const handleUploadDemo = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Simulate optimization for demo
  const handleOptimizeDemo = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 3000);
  };

  return (
    <ErrorBoundary level="page" componentName="AssetHubPage">
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">3D Asset Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Gérez Vos Assets 3D
              <br />
              Comme un Pro
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Uploadez, optimisez, convertissez et déployez vos modèles 3D partout.
              <br className="hidden sm:block" />
              <span className="text-blue-400 font-semibold">1000+ assets/heure</span> avec notre
              pipeline AI automatisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => {
                  const anchor = document.getElementById('demo-section');
                  anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg group"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Voir la Démo Interactive
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-500 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 px-8 py-6 text-lg font-semibold"
                >
                  Commencer Gratuitement
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Section - Interactive */}
      <section id="demo-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Essayez Maintenant
            </h2>
            <p className="text-xl text-gray-300">
              Uploadez un modèle 3D et voyez la magie opérer en temps réel
            </p>
          </motion.div>

          {/* Interactive Demo Panel */}
          <Card className="bg-gray-900/50 border-blue-500/20 p-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-400" />
                  Upload Asset
                </h3>

                <div
                  className="border-2 border-dashed border-blue-500/30 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all"
                  onClick={handleUploadDemo}
                >
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Cliquez ou glissez votre modèle 3D
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    GLB, FBX, OBJ, GLTF, USD, STL... (max 500MB)
                  </p>

                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-sm text-blue-400">
                        Upload: {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Supported Formats */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">
                    Formats Supportés (12+)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formats.input.map((format) => (
                      <span
                        key={format}
                        className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimization Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-purple-400" />
                  Optimisation
                </h3>

                <div className="space-y-4">
                  {optimizations.map((opt, index) => (
                    <Card
                      key={index}
                      className="bg-gray-800/50 border-gray-700/50 p-4 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            {opt.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {opt.description}
                          </p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">
                          -{opt.reduction}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full"
                          style={{ width: opt.reduction }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  onClick={handleOptimizeDemo}
                  disabled={isOptimizing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-6"
                >
                  {isOptimizing ? (
                    <>
                      <Gauge className="mr-2 w-5 h-5 animate-spin" />
                      Optimisation en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 w-5 h-5" />
                      Optimiser Maintenant
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Export Formats */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Export Formats
              </h4>
              <div className="flex flex-wrap gap-2">
                {formats.output.map((format) => (
                  <span
                    key={format}
                    className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 font-medium"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Fonctionnalités Avancées
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Pipeline complet de gestion d&apos;assets 3D, de l&apos;upload au déploiement
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

      {/* Deploy Targets Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Deploy Partout en 1 Clic
            </h2>
            <p className="text-xl text-gray-300">
              Exportez vos assets 3D optimisés vers toutes les plateformes
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {deployTargets.map((target, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gray-900/50 border-gray-700/50 p-6 text-center hover:border-blue-500/50 hover:bg-gray-900/70 transition-all group cursor-pointer">
                  <div className="text-blue-400 mb-3 flex justify-center group-hover:scale-110 transition-transform">
                    {target.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-300">
                    {target.name}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Deploy Flow Diagram */}
          <Card className="bg-gray-900/50 border-blue-500/20 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <p className="font-semibold text-white">Upload</p>
                <p className="text-xs text-gray-400">GLB, FBX, OBJ...</p>
              </div>

              <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <p className="font-semibold text-white">Optimize</p>
                <p className="text-xs text-gray-400">AI + LODs</p>
              </div>

              <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <FileType className="w-8 h-8 text-green-400" />
                </div>
                <p className="font-semibold text-white">Convert</p>
                <p className="text-xs text-gray-400">15+ formats</p>
              </div>

              <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <p className="font-semibold text-white">Deploy</p>
                <p className="text-xs text-gray-400">Web, AR, VR</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Technical Specs Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Spécifications Techniques
            </h2>
            <p className="text-xl text-gray-300">
              Performance et scalabilité enterprise-grade
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gray-900/50 border-blue-500/20 p-6">
              <Gauge className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-white">Performance</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Traitement &lt; 2s par asset</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>1000+ assets/heure (batch)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Compression 70-95%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Edge CDN global &lt; 50ms</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-purple-500/20 p-6">
              <Layers className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-white">Optimisation</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Auto LOD generation (4 niveaux)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Texture compression (WebP, AVIF, Basis)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>AI mesh simplification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Geometry cleanup auto</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-green-500/20 p-6">
              <Package className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-white">Scalabilité</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>BullMQ + Redis queue</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Multi-worker parallel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Rate limiting intelligent</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Auto-scaling workers</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Cas d&apos;Usage
            </h2>
            <p className="text-xl text-gray-300">
              Solution complète pour tous vos besoins 3D
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-blue-500/20 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    E-commerce AR
                  </h3>
                  <p className="text-gray-400">
                    Convertissez vos produits 3D en AR pour iOS (USDZ) et Android (GLB)
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Upload GLB → Auto USDZ conversion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Optimisation mobile (&lt; 10MB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>AR Quick Look + Scene Viewer ready</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-purple-500/20 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    Gaming Assets
                  </h3>
                  <p className="text-gray-400">
                    Préparez vos assets pour Unity, Unreal Engine, et autres moteurs
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Export FBX + GLB optimisés</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>LODs automatiques (4 niveaux)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Textures PBR compressées</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-green-500/20 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    Web Viewer
                  </h3>
                  <p className="text-gray-400">
                    Intégrez des viewers 3D sur votre site avec Three.js
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>GLB Draco ultra-léger</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Progressive loading</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Embed code 1-click</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    Batch Processing
                  </h3>
                  <p className="text-gray-400">
                    Traitez des milliers d&apos;assets automatiquement
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Upload CSV avec URLs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Processing pipeline auto</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Webhooks notifications</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
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
              Choisissez le plan adapté à vos besoins
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
                        {plan.assets}
                      </span>{' '}
                      assets
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">
                        {plan.bandwidth}
                      </span>{' '}
                      bandwidth
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

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
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
              Comparaison avec les solutions traditionnelles
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-blue-500/20 p-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                  <th className="pb-4 text-gray-400 font-semibold">Zakeke DAM</th>
                  <th className="pb-4 text-blue-400 font-semibold">Luneo Asset Hub</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Formats d&apos;entrée</td>
                  <td className="py-4 text-gray-400">GLB, FBX, OBJ (3)</td>
                  <td className="py-4 text-white font-semibold">
                    12+ formats (GLB, FBX, OBJ, USD, STL...)
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Optimisation AI</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Mesh simplification intelligente
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Batch Processing</td>
                  <td className="py-4 text-gray-400">Limité</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 1000+ assets/heure (BullMQ)
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">LOD Generation</td>
                  <td className="py-4 text-gray-400">Manuel</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 4 niveaux automatiques
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Deploy Targets</td>
                  <td className="py-4 text-gray-400">Web uniquement</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Web, AR, VR, Gaming Engines
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">CDN</td>
                  <td className="py-4 text-gray-400">Basique</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Multi-CDN Edge (Cloudflare + Vercel)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-gray-300">Prix (1000 assets)</td>
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

      {/* Integration Section */}
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
              API REST complète + SDK JavaScript + Webhooks
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-blue-500/20 p-8">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <FileType className="w-6 h-6 text-blue-400" />
                API REST
              </h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre>{`// Upload asset
const response = await fetch('/api/assets/upload', {
  method: 'POST',
  body: formData
});

// Optimize
await fetch('/api/assets/optimize', {
  method: 'POST',
  body: JSON.stringify({
    assetId: 'asset_123',
    options: {
      mesh: { reduction: 0.5 },
      textures: { format: 'webp' },
      lod: { levels: 4 }
    }
  })
});

// Convert
await fetch('/api/assets/convert', {
  method: 'POST',
  body: JSON.stringify({
    assetId: 'asset_123',
    format: 'usdz'
  })
});`}</pre>
              </div>
            </Card>

            <Card className="bg-gray-900/50 border-purple-500/20 p-8">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-400" />
                Webhooks
              </h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre>{`// Webhook payload
{
  "event": "asset.optimized",
  "data": {
    "id": "asset_123",
    "originalSize": "45.2 MB",
    "optimizedSize": "4.8 MB",
    "reduction": "89.4%",
    "formats": ["glb", "usdz"],
    "lods": [
      { "level": 0, "polygons": 50000 },
      { "level": 1, "polygons": 25000 },
      { "level": 2, "polygons": 10000 },
      { "level": 3, "polygons": 2500 }
    ],
    "cdnUrl": "https://cdn.luneo.app/..."
  }
}`}</pre>
              </div>
            </Card>
          </div>
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
              Prêt à Optimiser Vos Assets 3D ?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Rejoignez les entreprises qui font confiance à Luneo pour gérer
              leurs assets 3D professionnellement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg group"
                >
                  Démarrer Gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-500/50 hover:bg-blue-500/10 px-8 py-6 text-lg"
                >
                  Parler à un Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
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
                Quels formats 3D sont supportés ?
              </h3>
              <p className="text-gray-400">
                Nous supportons 12+ formats: GLB, GLTF, FBX, OBJ, USDZ, USD, STL, 3DS, COLLADA, PLY, X3D, DAE. 
                Import et export dans tous ces formats.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment fonctionne l&apos;optimisation AI ?
              </h3>
              <p className="text-gray-400">
                Notre algorithme analyse la géométrie et réduit intelligemment les polygones tout en 
                préservant les détails visuels importants. Réduction moyenne de 50-90% sans perte de qualité perceptible.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Puis-je traiter des milliers d&apos;assets ?
              </h3>
              <p className="text-gray-400">
                Oui ! Notre système de batch processing avec BullMQ et Redis peut traiter 1000+ assets par heure. 
                Uploadez un CSV avec vos URLs et laissez notre pipeline automatisé gérer le reste.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Où sont hébergés mes assets ?
              </h3>
              <p className="text-gray-400">
                Vos assets sont stockés sur Supabase Storage avec distribution via CDN multi-région 
                (Cloudflare + Vercel Edge). Latence &lt; 50ms worldwide avec 99.99% uptime SLA.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Puis-je intégrer avec mon stack existant ?
              </h3>
              <p className="text-gray-400">
                Absolument ! API REST complète, SDK JavaScript, webhooks, et intégrations natives avec 
                Shopify, WooCommerce, Unity, Unreal Engine. Ou utilisez notre package NPM <code className="bg-black/50 px-2 py-0.5 rounded text-blue-400">@luneo/ar-export</code>.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Commencez en 30 Secondes
          </h2>
          <p className="text-gray-300 mb-6">
            Aucune carte de crédit requise · Essai gratuit · Annulez quand vous voulez
          </p>
          <Link href="/register">
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
    </ErrorBoundary>
  );
}

