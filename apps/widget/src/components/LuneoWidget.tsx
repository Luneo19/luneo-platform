import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, ShieldCheck } from 'lucide-react';
import { PromptInput } from './PromptInput';
import { PreviewCanvas } from './PreviewCanvas';
import { ErrorBoundary } from './ErrorBoundary';
import { ARViewer } from './ARViewer';
import { useLuneoWidget } from '../hooks/useLuneoWidget';
import { cn } from '../lib/utils';
import type { WidgetConfig, Design } from '../types';

interface LuneoWidgetProps {
  config: WidgetConfig;
  onDesignGenerated?: (design: Design) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const LuneoWidget: React.FC<LuneoWidgetProps> = ({
  config,
  onDesignGenerated,
  onError,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'2d' | 'ar'>('2d');

  const {
    prompt,
    setPrompt,
    generatedDesign,
    generateDesign,
    error,
    isLoading,
    rateLimitRemaining,
  } = useLuneoWidget(config, onDesignGenerated, onError);

  const handleGenerate = useCallback(async () => {
    await generateDesign(prompt);
  }, [generateDesign, prompt]);

  const handleDownload = useCallback(
    async (format: string) => {
      if (!generatedDesign?.imageUrl) {
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = generatedDesign.imageUrl;
      anchor.rel = 'noopener noreferrer';
      anchor.download = `luneo-design.${format.toLowerCase()}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    [generatedDesign]
  );

  const handleShare = useCallback(async () => {
    if (!generatedDesign?.imageUrl || typeof navigator === 'undefined') {
      return;
    }

    if (navigator.share && navigator.canShare?.({ url: generatedDesign.imageUrl })) {
      await navigator.share({
        title: config.productName,
        text: "Découvrez mon design généré avec Luneo AI",
        url: generatedDesign.imageUrl,
      });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(generatedDesign.imageUrl);
      alert('Lien copié dans le presse-papiers.');
    }
  }, [generatedDesign, config.productName]);

  const securityBadge = useMemo(() => {
    const remaining = rateLimitRemaining;
    return remaining <= 1
      ? "Limite presque atteinte"
      : `${remaining} génération${remaining > 1 ? 's' : ''} disponibles`;
  }, [rateLimitRemaining]);

  const allowAR = Boolean(config.features?.ar);

  return (
    <ErrorBoundary onError={onError}>
      <div
        className={cn(
          'luneo-widget bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden',
          className
        )}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Personnalisez votre {config.productName}</h2>
                <p className="text-blue-100 text-sm">Créez un design unique avec l'IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              <span>{securityBadge}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleGenerate}
            isLoading={isLoading}
            placeholder={`Décrivez votre ${config.productName} idéal...`}
            maxLength={config.promptMaxLength ?? 500}
          />

          <motion.button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Générer avec l'IA</span>
              </>
            )}
          </motion.button>

          {generatedDesign && (
            <div>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('2d')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                    activeTab === '2d'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Prévisualisation
                </button>
                {allowAR && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ar')}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                      activeTab === 'ar'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Réalité Augmentée
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {activeTab === '2d' ? (
                  <PreviewCanvas
                    design={generatedDesign}
                    isGenerating={isLoading}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onRegenerate={!isLoading ? () => generateDesign(prompt) : undefined}
                    onARPreview={allowAR ? () => setActiveTab('ar') : undefined}
                  />
                ) : (
                  <ARViewer design={generatedDesign} />
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error.message}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};


