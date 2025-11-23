'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Image as ImageIcon, Palette, Zap, Download, RefreshCw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function AIStudioPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors de la génération');
      }

      const generatedDesign = result.data?.design || result.design;
      const imageUrl = result.data?.image_url || result.image_url || generatedDesign?.preview_url;

      if (imageUrl) {
        setGeneratedImages([{
          id: generatedDesign?.id || Date.now().toString(),
          url: imageUrl,
          prompt,
          style,
          createdAt: new Date().toISOString(),
        }, ...generatedImages]);
        
        toast({
          title: "Design généré",
          description: "Votre design a été généré avec succès",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('AI generation error', {
        error,
        prompt,
        style,
        message: errorMessage,
      });
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = [
    { id: 'photorealistic', name: 'Photoréaliste', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'artistic', name: 'Artistique', icon: <Palette className="w-4 h-4" /> },
    { id: 'minimalist', name: 'Minimaliste', icon: <Zap className="w-4 h-4" /> },
    { id: 'vintage', name: 'Vintage', icon: <Wand2 className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AI Studio</h1>
        <p className="text-gray-400">Générez des designs uniques avec l'IA (DALL-E 3)</p>
      </div>

      {/* Generator Card */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Décrivez votre design
            </label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: T-shirt avec logo lion moderne, couleurs vives..."
              className="bg-gray-900 border-gray-600 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    style === s.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                  }`}
                >
                  {s.icon}
                  <span className="text-sm text-white">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer avec IA
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {generatedImages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Vos créations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden bg-gray-800/50 border-gray-700">
                  <div className="aspect-square bg-gray-900 relative">
                    {img.url && (
                      <NextImage
                        src={img.url}
                        alt={img.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{img.prompt}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {generatedImages.length === 0 && (
        <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed text-center">
          <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Aucun design généré
          </h3>
          <p className="text-sm text-gray-500">
            Entrez un prompt ci-dessus pour commencer
          </p>
        </Card>
      )}
    </div>
  );
}
