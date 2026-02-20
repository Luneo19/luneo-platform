'use client';

/**
 * AI GENERATION PANEL
 * Panel for generating AI-powered customizations from the dashboard.
 * Calls the NestJS generation API via Next.js proxy routes.
 * Supports: prompt input, style/effect selection, polling, preview.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Wand2,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import Image from 'next/image';

// ========================================
// TYPES
// ========================================

interface AIGenerationPanelProps {
  productId: string;
  onGenerated?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface GenerationResult {
  publicId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  arModelUrl?: string;
  status: string;
}

type GenerationStatus = 'idle' | 'submitting' | 'processing' | 'completed' | 'error';

const EFFECTS = [
  { value: 'engraved', label: 'Gravure' },
  { value: 'embossed', label: 'Relief' },
  { value: 'printed', label: 'Imprimé' },
  { value: '3d_shadow', label: 'Ombre 3D' },
];

const STYLES = [
  { value: 'elegant', label: 'Élégant' },
  { value: 'modern', label: 'Moderne' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimalist', label: 'Minimaliste' },
  { value: 'bold', label: 'Bold' },
];

// ========================================
// COMPONENT
// ========================================

export function AIGenerationPanel({
  productId,
  onGenerated,
  onError,
  className = '',
}: AIGenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [effect, setEffect] = useState('engraved');
  const [style, setStyle] = useState('elegant');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ========================================
  // HANDLERS
  // ========================================

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setStatus('submitting');
    setProgress(5);
    setErrorMessage(null);
    setPreviewUrl(null);

    try {
      // Call the Next.js proxy -> NestJS generation/dashboard/create
      const response = await fetch('/api/ai/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userPrompt: prompt.trim(),
          customizations: {
            default: {
              text: prompt.trim(),
              effect,
              style,
            },
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(err.error || err.message || 'Erreur lors de la génération');
      }

      const data = await response.json();
      const genPublicId = data.publicId || data.id;
      setPublicId(genPublicId);
      setStatus('processing');
      setProgress(20);

      logger.info('AI generation started', { publicId: genPublicId, productId });

      // Start polling for status
      startPolling(genPublicId);
    } catch (error: unknown) {
      const msg = getErrorDisplayMessage(error);
      setStatus('error');
      setErrorMessage(msg);
      setProgress(0);
      onError?.(msg);
      logger.error('AI generation failed', { error, productId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, effect, style, productId, onError]);

  const startPolling = useCallback(
    (genPublicId: string) => {
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes max

      pollingRef.current = setInterval(async () => {
        attempts++;
        setProgress(Math.min(20 + (attempts / maxAttempts) * 70, 90));

        try {
          const res = await fetch(`/api/ai/generate-design/status?publicId=${genPublicId}`);
          if (!res.ok) return;

          const statusData = await res.json() as { status?: string; result?: { imageUrl?: string; thumbnailUrl?: string; arModelUrl?: string }; error?: string };
          const genStatus = statusData.status?.toUpperCase();

          if (genStatus === 'COMPLETED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;

            const result = statusData.result;
            const imageUrl = result?.imageUrl || result?.thumbnailUrl;
            setPreviewUrl(imageUrl || null);
            setProgress(100);
            setStatus('completed');

            onGenerated?.({
              publicId: genPublicId,
              imageUrl: imageUrl || '',
              thumbnailUrl: result?.thumbnailUrl,
              arModelUrl: result?.arModelUrl,
              status: 'COMPLETED',
            });

            logger.info('AI generation completed', { publicId: genPublicId });
          } else if (genStatus === 'FAILED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;

            const errMsg = statusData.error || 'La génération a échoué';
            setStatus('error');
            setErrorMessage(errMsg);
            setProgress(0);
            onError?.(errMsg);
          }

          if (attempts >= maxAttempts) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setStatus('error');
            setErrorMessage('Timeout: la génération a pris trop de temps');
            setProgress(0);
          }
        } catch {
          // Network error during polling - continue
        }
      }, 2000);
    },
    [onGenerated, onError]
  );

  const handleReset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPrompt('');
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setPreviewUrl(null);
    setPublicId(null);
  }, []);

  const isDisabled = status === 'submitting' || status === 'processing';

  // ========================================
  // RENDER
  // ========================================

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Génération IA
        </CardTitle>
        <CardDescription>
          Décrivez votre personnalisation et l'IA générera le rendu
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Votre texte / description</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Je t'aime en lettres dorées élégantes..."
            className="min-h-[80px] resize-none"
            disabled={isDisabled}
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Soyez descriptif pour un meilleur résultat</span>
            <span>{prompt.length}/500</span>
          </div>
        </div>

        {/* Options row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Effet</Label>
            <Select value={effect} onValueChange={setEffect} disabled={isDisabled}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EFFECTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Style</Label>
            <Select value={style} onValueChange={setStyle} disabled={isDisabled}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress */}
        {(status === 'submitting' || status === 'processing') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {status === 'submitting' ? 'Envoi en cours...' : 'Génération IA en cours...'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Completed */}
        {status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Génération terminée avec succès !
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border bg-gray-50">
            <Image width={200} height={200}
              src={previewUrl}
              alt="Aperçu IA"
              className="w-full h-auto max-h-[300px] object-contain"
            unoptimized />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <Eye className="w-3 h-3 mr-1" />
                Plein écran
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isDisabled}
          >
            {isDisabled ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Générer
              </>
            )}
          </Button>
          {status !== 'idle' && (
            <Button variant="outline" onClick={handleReset} disabled={isDisabled}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIGenerationPanel;
