'use client';

import { useState } from 'react';
import { ApiService } from '../../services/api.service';
import type { WidgetConfig } from '../../types/designer.types';

interface GenerationPanelProps {
  apiService: ApiService;
  productId: string;
  customizations: Record<string, any>;
  onGenerationComplete?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

export function GenerationPanel({
  apiService,
  productId,
  customizations,
  onGenerationComplete,
  onError,
}: GenerationPanelProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus('pending');
    setProgress(0);

    try {
      // Créer la génération
      const response = await apiService.createGeneration(
        productId,
        customizations,
        userPrompt || undefined,
        `session_${Date.now()}`,
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create generation');
      }

      setGenerationId(response.data.id);
      setStatus('processing');

      // Polling pour le statut
      const pollStatus = async () => {
        const statusResponse = await apiService.getGenerationStatus(response.data!.id);
        
        if (statusResponse.success && statusResponse.data) {
          const currentStatus = statusResponse.data.status;
          setStatus(currentStatus as any);
          
          if (currentStatus === 'completed' && statusResponse.data.result) {
            setResultImageUrl(statusResponse.data.result.imageUrl);
            setProgress(100);
            onGenerationComplete?.(statusResponse.data.result.imageUrl);
            setIsGenerating(false);
          } else if (currentStatus === 'failed') {
            setStatus('failed');
            setIsGenerating(false);
            onError?.(new Error(statusResponse.data.error || 'Generation failed'));
          } else if (currentStatus === 'processing') {
            setProgress(statusResponse.data.progress || 50);
            // Continuer le polling
            setTimeout(pollStatus, 2000);
          } else {
            // Pending, continuer le polling
            setTimeout(pollStatus, 2000);
          }
        } else {
          throw new Error(statusResponse.error || 'Failed to get status');
        }
      };

      // Démarrer le polling après 2 secondes
      setTimeout(pollStatus, 2000);
    } catch (error) {
      setStatus('failed');
      setIsGenerating(false);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Generate with AI</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Instructions (optional)
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g., Make it more elegant, add vintage style..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isGenerating}
          />
        </div>

        {status === 'idle' && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Image
          </button>
        )}

        {(status === 'pending' || status === 'processing') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Generating...</span>
              <span className="text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">This may take 10-30 seconds</p>
          </div>
        )}

        {status === 'completed' && resultImageUrl && (
          <div className="space-y-2">
            <img
              src={resultImageUrl}
              alt="Generated"
              className="w-full rounded-md border border-gray-200"
            />
            <button
              onClick={() => {
                setStatus('idle');
                setResultImageUrl(null);
                setGenerationId(null);
                setProgress(0);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Generate Another
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">Generation failed. Please try again.</p>
            <button
              onClick={() => {
                setStatus('idle');
                setGenerationId(null);
                setProgress(0);
              }}
              className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

