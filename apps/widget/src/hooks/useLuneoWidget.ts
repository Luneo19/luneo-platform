import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Design } from '../types';
import type { WidgetConfig } from '../types';
import {
  createRateLimiter,
  DEFAULT_RATE_LIMIT,
  getRuntimeOrigin,
  isOriginAllowed,
  sanitizePrompt,
} from '../lib/security';
import { safeFetch } from '../lib/utils';

interface UseLuneoWidgetResult {
  prompt: string;
  setPrompt: (value: string) => void;
  generatedDesign: Design | null;
  generateDesign: (rawPrompt?: string) => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  reset: () => void;
  rateLimitRemaining: number;
}

const DEFAULT_API_BASE = 'https://api.luneo.app/widget';

const normaliseConfig = (config: WidgetConfig) => {
  const apiBaseUrl = config.apiBaseUrl?.replace(/\/$/, '') ?? DEFAULT_API_BASE;
  const promptMaxLength = config.promptMaxLength ?? 500;
  const rateLimit = {
    ...DEFAULT_RATE_LIMIT,
    ...config.rateLimit,
  };
  const features = config.features ?? { ai: true, ar: false, '3d': false };

  const security = {
    allowedOrigins: config.security?.allowedOrigins ?? ['*'],
    trustedCdnUrls: config.security?.trustedCdnUrls,
    sandboxAttributes: config.security?.sandboxAttributes,
    requestTimeoutMs: config.security?.requestTimeoutMs ?? 15_000,
  };

  return {
    ...config,
    apiBaseUrl,
    promptMaxLength,
    rateLimit,
    features,
    security,
  };
};

export const useLuneoWidget = (
  rawConfig: WidgetConfig,
  onDesignGenerated?: (design: Design) => void,
  onError?: (error: Error) => void
): UseLuneoWidgetResult => {
  const config = useMemo(() => normaliseConfig(rawConfig), [rawConfig]);
  const [prompt, setPromptState] = useState('');
  const [generatedDesign, setGeneratedDesign] = useState<Design | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateVersion, setRateVersion] = useState(0);
  const limiterRef = useRef(createRateLimiter(config.rateLimit));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    limiterRef.current = createRateLimiter(config.rateLimit);
    setRateVersion((value) => value + 1);
  }, [config.rateLimit]);

  const setPrompt = useCallback(
    (value: string) => {
      const sanitized = sanitizePrompt(value, config.promptMaxLength);
      setPromptState(sanitized);
    },
    [config.promptMaxLength]
  );

  const reset = useCallback(() => {
    setGeneratedDesign(null);
    setError(null);
    limiterRef.current.reset();
  }, []);

  const generateDesign = useCallback(
    async (raw?: string) => {
      const preparedPrompt = sanitizePrompt(raw ?? prompt, config.promptMaxLength);

      if (!preparedPrompt) {
        const err = new Error('Le prompt est vide après sanitation.');
        setError(err);
        onError?.(err);
        return;
      }

      if (!limiterRef.current.tryConsume()) {
        const err = new Error('Limite de génération atteinte. Veuillez patienter quelques instants.');
        setError(err);
        onError?.(err);
        return;
      }

      const runtimeOrigin = getRuntimeOrigin();
      if (!isOriginAllowed(runtimeOrigin, config.security.allowedOrigins)) {
        const err = new Error('Origine non autorisée pour le widget.');
        setError(err);
        onError?.(err);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const response = await safeFetch(`${config.apiBaseUrl}/designs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Luneo-Widget-Key': config.apiKey,
            'X-Luneo-Widget-Origin': runtimeOrigin ?? 'server',
          },
          body: JSON.stringify({
            prompt: preparedPrompt,
            productName: config.productName,
            productId: config.productId,
            features: config.features,
            language: config.language,
          }),
          signal: controller.signal,
          timeoutMs: config.security.requestTimeoutMs,
        });

        if (!response.ok) {
          throw new Error(`Échec de la génération (${response.status})`);
        }

        const payload = await response.json();
        const design: Design | null = payload?.data?.design ?? payload?.design ?? null;

        if (!design) {
          throw new Error('Réponse invalide du service de génération.');
        }

        setGeneratedDesign(design);
        onDesignGenerated?.(design);
        setRateVersion((value) => value + 1);
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(errorInstance);
        onError?.(errorInstance);
      } finally {
        setIsLoading(false);
      }
    },
    [config, onDesignGenerated, onError, prompt]
  );

  const rateLimitRemaining = useMemo(
    () => limiterRef.current.remaining(),
    [rateVersion, error, isLoading, prompt]
  );

  return {
    prompt,
    setPrompt,
    generatedDesign,
    generateDesign,
    error,
    isLoading,
    reset,
    rateLimitRemaining,
  };
};

export type UseLuneoWidget = typeof useLuneoWidget;


