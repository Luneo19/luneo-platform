'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Download,
  ArrowRight,
  Eye,
  Share2,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { logger } from '@/lib/logger';

function AIDesignHubPageContent() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photoréaliste');
  const [variations, setVariations] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    return JSON.parse(localStorage.getItem('ai-demo-results') ?? '[]');
  });

  useEffect(() => {
    localStorage.setItem('ai-demo-results', JSON.stringify(results.slice(0, 12)));
  }, [results]);

  const generateDesigns = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Décrivez votre idée avant de générer 😊');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          count: variations,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      
      // Handle different response structures
      let urls: string[] = [];
      if (data?.data?.images && Array.isArray(data.data.images)) {
        urls = data.data.images.map((img: { url?: string }) => img.url).filter(Boolean);
      } else if (data?.images && Array.isArray(data.images)) {
        urls = data.images.map((img: { url?: string }) => img.url).filter(Boolean);
      } else if (data?.url) {
        urls = [data.url];
      } else if (data?.imageUrl) {
        urls = [data.imageUrl];
      } else if (typeof data === 'string') {
        urls = [data];
      }
      
      if (!urls.length) {
        setError("L'IA n'a rien renvoyé. Réessayez avec un prompt plus précis ou vérifiez votre connexion.");
        logger.warn('No images in AI response', { data });
      } else {
        setResults((prev) => [...urls, ...prev].slice(0, 12));
      }
    } catch (err: any) {
      logger.error('AI demo error', {
        error: err,
        prompt,
        style,
        variations,
        message: err.message || 'Unknown error',
      });
      setError("Erreur pendant la génération, réessayez dans quelques secondes.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, variations]);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'DALL-E 3 Intégré',
      description: 'Génération d\'images haute qualité avec l\'IA la plus avancée d\'OpenAI.',
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: 'Prompts Intelligents',
      description: 'Assistant IA pour optimiser vos prompts et obtenir les meilleurs résultats.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Génération par Lots',
      description: 'Créez jusqu\'à 1000+ designs en parallèle avec BullMQ et Redis.',
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Variations Automatiques',
      description: 'Générez des variations de vos designs préférés en un clic.',
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: '4 Styles Prédéfinis',
      description: 'Photoréaliste, Artistique, Minimaliste, Vintage + styles personnalisés.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Multi-Format',
      description: 'PNG transparent, JPG optimisé, WebP, SVG vectoriel.',
    },
  ];

  const benefits = [
    {
      title: 'Vitesse',
      description: 'Génération en secondes',
      stat: '< 10s',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Volume',
      description: 'Designs par heure',
      stat: '1000+',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Qualité',
      description: 'Résolution DALL-E 3',
      stat: '1024px',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Économie',
      description: 'vs Designer humain',
      stat: '-95%',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const useCases = [
    {
      title: 'E-commerce',
      description: 'Générez des milliers de variantes produits',
      icon: '🛍️',
    },
    {
      title: 'Marketing',
      description: 'Créez des visuels pour vos campagnes',
      icon: '📈',
    },
    {
      title: 'Print on Demand',
      description: 'Designs uniques pour Printful/Printify',
      icon: '👕',
    },
    {
      title: 'Social Media',
      description: 'Contenus visuels pour réseaux sociaux',
      icon: '📱',
    },
  ];

  const workflow = [
    {
      step: '1',
      title: 'Décrivez votre vision',
      description: 'Entrez un prompt ou utilisez nos templates',
    },
    {
      step: '2',
      title: 'Choisissez le style',
      description: 'Sélectionnez parmi 4 styles ou créez le vôtre',
    },
    {
      step: '3',
      title: 'Générez en masse',
      description: '1 design ou 1000, même processus simple',
    },
    {
      step: '4',
      title: 'Exportez & Utilisez',
      description: 'Download PNG/JPG ou intégrez directement',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-pink-900 to-purple-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-pink-300 text-sm font-medium">AI-Powered Design Generation</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              AI Design Hub
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Création Infinie
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Générez des milliers de designs uniques avec DALL-E 3. Du concept à l'export en
              quelques secondes. Parfait pour e-commerce, marketing, et print on demand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  const textarea = document.getElementById('ai-demo-prompt');
                  textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 h-12 text-lg"
              >
                <Eye className="w-5 h-5 mr-2" />
                Tester maintenant
              </Button>
              <Link href="/register">
                <Button
                  variant='outline'
                  className="border-blue-500 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 h-12 px-8 text-lg font-semibold"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion>
        </div>
      </section>

      {/* Demo interactive */}
      <section className="py-20 px-4 bg-gray-900/90 border-y border-pink-500/10">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-2">
          <Card className="bg-gray-900 border-pink-500/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Générateur IA (démo live)</h2>
            <p className="text-gray-400 mb-6">
              Saisissez un prompt, choisissez un style et générez jusqu'à 8 variations.
              Les images sont générées via l'API DALL-E de Luneo Lab (latence ~5s en moyenne).
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="ai-demo-prompt" className="text-sm text-gray-300 mb-2 block">
                  Description
                </label>
                <Textarea
                  id="ai-demo-prompt"
                  placeholder="Ex. : Illustration futuriste d’un skateboard chrome lumineux dans un tunnel néon"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-gray-800 border border-pink-500/30 rounded-md px-3 py-2 text-white"
                  >
                    <option value="photoréaliste">Photoréaliste</option>
                    <option value="artistique">Artistique</option>
                    <option value="minimaliste">Minimaliste</option>
                    <option value="vintage">Vintage</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Variations</label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={variations}
                    onChange={(e) => setVariations(Math.min(8, Math.max(1, Number(e.target.value))))}
                  />
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}
              <Button
                disabled={isGenerating}
                onClick={generateDesigns}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white h-12 text-lg"
              >
                {isGenerating ? 'Génération en cours...' : 'Générer avec l’IA'}
              </Button>
            </div>
          </Card>
          <Card className="bg-gray-900 border-purple-500/30 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Résultats récents</h2>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setResults([])}
                disabled={!results.length}
              >
                Effacer
              </Button>
            </div>
            {results.length === 0 ? (
              <div className="text-gray-400 text-center py-12">
                Générez votre premier set d’images pour les voir ici.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((url, index) =>
                  url ? (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-white/10">
                      <Image src={url} alt={`AI result ${index + 1}`} width={512} height={512} className="object-cover w-full h-48" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm text-white">
                        <Button size="sm" variant="secondary" asChild>
                          <a href={url} download target="_blank" rel="noreferrer">
                            Télécharger
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Intelligence Artificielle de Pointe
            </h2>
            <p className="text-xl text-gray-400">DALL-E 3 + optimisations Luneo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-pink-500/50 transition-all h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Stats */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-full mb-4`}
                >
                  <span className="text-3xl font-bold text-white">{benefit.stat}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comment ça marche</h2>
            <p className="text-xl text-gray-400">4 étapes simples vers l'infini</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Cas d'Usage</h2>
            <p className="text-xl text-gray-400">Boostez votre créativité</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, i) => (
              <Card
                key={i}
                className="p-6 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all text-center"
              >
                <div className="text-6xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-400">{useCase.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à créer avec l'IA ?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Rejoignez des milliers de créateurs qui utilisent Luneo AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-pink-900 hover:bg-gray-100 px-8 h-12 text-lg font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Commencer maintenant
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white/50 text-white hover:bg-white/20 h-12 px-8 text-lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Parler à un expert
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const AIDesignHubPageMemo = memo(AIDesignHubPageContent);

export default function AIDesignHubPage() {
  return (
    <ErrorBoundary componentName="AIDesignHubPage">
      <AIDesignHubPageMemo />
    </ErrorBoundary>
  );
}
