import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Eye, Download, Share } from 'lucide-react';
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
  className
}) => {
  const [activeTab, setActiveTab] = useState<'2d' | 'ar'>('2d');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    prompt,
    setPrompt,
    generatedDesign,
    generateDesign,
    error,
    isLoading
  } = useLuneoWidget(config, onDesignGenerated, onError);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await generateDesign(prompt);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ErrorBoundary onError={onError}>
      <div className={cn(
        "luneo-widget bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Personnalisez votre {config.productName}</h2>
              <p className="text-blue-100 text-sm">Créez un design unique avec l'IA</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Prompt Input */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            placeholder={`Décrivez votre ${config.productName} idéal...`}
            disabled={isLoading}
          />

          {/* Generate Button */}
          <motion.button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGenerating ? (
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

          {/* Preview Tabs */}
          {generatedDesign && (
            <div className="mt-6">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setActiveTab('2d')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                    activeTab === '2d'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Prévisualisation
                </button>
                <button
                  onClick={() => setActiveTab('ar')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                    activeTab === 'ar'
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Réalité Augmentée
                </button>
              </div>

              {/* Preview Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                {activeTab === '2d' ? (
                  <PreviewCanvas design={generatedDesign} />
                ) : (
                  <ARViewer design={generatedDesign} />
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                  <Share className="w-4 h-4" />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};


