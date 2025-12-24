'use client';

import React, { useState, memo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Wand2, Image as ImageIcon, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';

function AIDesignHubDemoPageContent() {
  const [prompt, setPrompt] = useState('T-shirt avec logo lion moderne, couleurs vives');
  const [style, setStyle] = useState('photorealistic');
  const [variations, setVariations] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Example prompts for quick start
  const examplePrompts = [
    'T-shirt avec logo lion moderne, couleurs vives',
    'Poster vintage avec typographie art déco',
    'Mug personnalisé avec motif géométrique',
    'Sac à dos avec design minimaliste',
  ];

  const generateDesigns = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Décrivez votre idée avant de générer 😊');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      // Simulate API call (in production, this would call /api/ai/generate)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock results for demo
      const mockResults = Array.from({ length: variations }, (_, i) => 
        `https://picsum.photos/seed/${prompt}-${i}/512/512`
      );
      
      setResults(mockResults);
      setSelectedImage(mockResults[0]);
      logger.info('AI designs generated (demo mode)', { prompt, variations });
    } catch (err) {
      logger.error('AI generation error', { error: err });
      setError('Erreur lors de la génération. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, variations]);

  const handleExport = useCallback((imageUrl: string) => {
    logger.info('Export triggered', { imageUrl });
    // In production, this would download the image
    window.open(imageUrl, '_blank');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/solutions/ai-design-hub">
            <Button
              variant="outline"
              className="border-pink-500/50 hover:bg-pink-500/10 mb-6"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  AI Design Hub
                </h1>
                <p className="text-gray-400">Démo Interactive - Génération IA</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-6">
              Générez des designs uniques avec DALL-E 3 en quelques secondes
            </p>
          </motion.div>
        </div>

        {/* Demo Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Prompt Input */}
          <Card className="lg:col-span-1 p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-pink-400" />
              Créer un Design
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez votre design..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="photorealistic">Photoréaliste</option>
                  <option value="illustration">Illustration</option>
                  <option value="minimalist">Minimaliste</option>
                  <option value="vintage">Vintage</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Variantes: {variations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={variations}
                  onChange={(e) => setVariations(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={generateDesigns}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Example Prompts */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Exemples rapides:</p>
              <div className="space-y-2">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Right: Results */}
          <Card className="lg:col-span-2 p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-400" />
              Résultats ({results.length})
            </h3>

            {isGenerating ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-pink-400 animate-spin" />
                  <p className="text-gray-400">Génération en cours...</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300 mb-2">Aucun design généré</p>
                  <p className="text-sm text-gray-400">Remplissez le formulaire et cliquez sur "Générer"</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {results.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(url)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === url
                        ? 'border-pink-500 scale-105'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Design ${i + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    {selectedImage === url && (
                      <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white">Variante {i + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedImage && results.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Design sélectionné</p>
                  <Button
                    onClick={() => handleExport(selectedImage)}
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-pink-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              DALL-E 3
            </h3>
            <p className="text-sm text-gray-400">
              Génération haute qualité 1024x1024 avec IA de pointe
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <RefreshCw className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Variantes Illimitées
            </h3>
            <p className="text-sm text-gray-400">
              Générez jusqu'à 8 variantes simultanément pour trouver le design parfait
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-blue-500/20 rounded-lg">
            <Download className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Export Print-Ready
            </h3>
            <p className="text-sm text-gray-400">
              Téléchargez en PNG haute résolution ou PDF 300 DPI
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Débloquez la génération IA illimitée avec un compte
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedAIDesignHubDemoPageContent = memo(AIDesignHubDemoPageContent);

export default function AIDesignHubDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="AIDesignHubDemoPage">
      <MemoizedAIDesignHubDemoPageContent />
    </ErrorBoundary>
  );
}





















