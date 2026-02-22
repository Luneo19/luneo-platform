/**
 * ★★★ COMPOSANT - INPUT PROMPT IA ★★★
 * Interface pour saisir le texte de personnalisation
 * - Validation en temps réel
 * - Compteur de caractères
 * - Feedback visuel
 * - Intégration tRPC
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Zap, RotateCcw } from 'lucide-react';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

// ========================================
// TYPES
// ========================================

interface PromptInputProps {
  productId: string;
  zoneId: string;
  maxChars?: number;
  placeholder?: string;
  onGenerated?: (customizationId: string, previewUrl: string, modelUrl: string) => void;
  onError?: (error: string) => void;
}

interface GenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error';
  customizationId?: string;
  message?: string;
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function PromptInputContent({
  productId,
  zoneId,
  maxChars = 100,
  placeholder = "Entrez votre texte... Ex: Je t'aime ma chérie",
  onGenerated,
  onError,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ status: 'idle' });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const generateMutation = trpc.customization.generateFromPrompt.useMutation();
  const checkStatusQuery = trpc.customization.checkStatus.useQuery(
    { id: generationStatus.customizationId! },
    {
      enabled: generationStatus.status === 'generating' && !!generationStatus.customizationId,
      refetchInterval: 2000, // Poll toutes les 2 secondes
    }
  );

  // Computed
  const charCount = useMemo(() => prompt.length, [prompt]);
  const remainingChars = useMemo(() => maxChars - charCount, [maxChars, charCount]);
  const isValid = useMemo(() => {
    return prompt.trim().length > 0 && prompt.trim().length <= maxChars;
  }, [prompt, maxChars]);

  const charCountColor = useMemo(() => {
    if (remainingChars < 0) return 'text-red-500';
    if (remainingChars < 10) return 'text-yellow-500';
    return 'text-gray-500';
  }, [remainingChars]);

  // ========================================
  // EFFECTS
  // ========================================

  // Poll status when generating
  useEffect(() => {
    if (generationStatus.status === 'generating' && checkStatusQuery.data) {
      const status = checkStatusQuery.data.status;

      if (status === 'COMPLETED') {
        setGenerationStatus({
          status: 'completed',
          customizationId: checkStatusQuery.data.id,
          message: 'Génération terminée !',
        });

        if (checkStatusQuery.data.previewUrl && checkStatusQuery.data.modelUrl) {
          onGenerated?.(
            checkStatusQuery.data.id,
            checkStatusQuery.data.previewUrl,
            checkStatusQuery.data.modelUrl
          );
        }

        // Clear polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else if (status === 'FAILED') {
        setGenerationStatus({
          status: 'error',
          message: checkStatusQuery.data.errorMessage || 'Erreur lors de la génération',
        });

        onError?.(checkStatusQuery.data.errorMessage || 'Erreur lors de la génération');

        // Clear polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    }
  }, [checkStatusQuery.data, generationStatus.status, onGenerated, onError, pollingInterval]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleGenerate = useCallback(async () => {
    if (!isValid) return;

    setGenerationStatus({ status: 'generating', message: 'Génération en cours...' });

    try {
      const result = await generateMutation.mutateAsync({
        productId,
        zoneId,
        prompt: prompt.trim(),
      });

      setGenerationStatus({
        status: 'generating',
        customizationId: result.id,
        message: result.message || 'Génération en cours...',
      });

      logger.info('Generation started', { customizationId: result.id });
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      setGenerationStatus({
        status: 'error',
        message: errorMessage,
      });

      onError?.(errorMessage);
      logger.error('Generation error', { error });
    }
  }, [isValid, prompt, productId, zoneId, generateMutation, onError]);

  const handleReset = useCallback(() => {
    setPrompt('');
    setGenerationStatus({ status: 'idle' });
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Personnalisation par IA
        </CardTitle>
        <CardDescription>
          Entrez votre texte et notre IA générera un rendu 3D personnalisé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Textarea */}
        <div className="space-y-2">
          <Label htmlFor="prompt-input">Votre texte</Label>
          <div className="relative">
            <Textarea
              id="prompt-input"
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] resize-none pr-16"
              disabled={generationStatus.status === 'generating'}
              maxLength={maxChars + 10} // Allow slight overflow for UX
            />
            <div className="absolute bottom-2 right-2 text-sm">
              <span className={charCountColor}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>
          {remainingChars < 0 && (
            <p className="text-sm text-red-500">
              {Math.abs(remainingChars)} caractère{Math.abs(remainingChars) > 1 ? 's' : ''} en trop
            </p>
          )}
        </div>

        {/* Status alerts */}
        {generationStatus.status === 'generating' && (
          <Alert>
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStatus.message || 'Génération en cours...'}</span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {generationStatus.status === 'completed' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {generationStatus.message || 'Génération terminée avec succès !'}
            </AlertDescription>
          </Alert>
        )}

        {generationStatus.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{generationStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleGenerate}
            disabled={!isValid || generationStatus.status === 'generating'}
            size="lg"
          >
            {generationStatus.status === 'generating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Générer le rendu
              </>
            )}
          </Button>
          {generationStatus.status !== 'idle' && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-medium">💡 Conseils :</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Utilisez des phrases courtes et claires</li>
            <li>Évitez les caractères spéciaux complexes</li>
            <li>Le texte sera gravé/appliqué sur le produit</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// EXPORT
// ========================================

const PromptInputComponent = memo(PromptInputContent);

export function PromptInput(props: PromptInputProps) {
  return (
    <ErrorBoundary>
      <PromptInputComponent {...props} />
    </ErrorBoundary>
  );
}

export default PromptInput;
