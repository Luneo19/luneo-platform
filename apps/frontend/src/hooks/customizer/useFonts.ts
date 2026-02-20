/**
 * useFonts
 * Font loading and management hook
 * Fetches available fonts from API and manages font loading
 */

'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { FontManager } from '@/lib/customizer';
import { logger } from '@/lib/logger';
import { useCallback } from 'react';

interface Font {
  id: string;
  family: string;
  name?: string;
  category?: string;
  variants?: string[];
  url?: string;
  isSystem?: boolean;
}

interface UseFontsReturn {
  fonts: Font[];
  systemFonts: Font[];
  customFonts: Font[];
  isLoading: boolean;
  error: Error | null;
  loadFont: (family: string, url?: string) => Promise<void>;
  getLoadedFonts: () => string[];
  refetch: () => void;
}

/**
 * Font management hook
 */
export function useFonts(): UseFontsReturn {
  const fontManager = useMemo(() => new FontManager(), []);

  // Fetch fonts from API
  const {
    data: fontsData,
    isLoading,
    error,
    refetch,
  } = trpc.visualCustomizer.assets.getFonts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fonts = (fontsData as Font[]) || [];

  // Separate system and custom fonts
  const { systemFonts, customFonts } = useMemo(() => {
    const system: Font[] = [];
    const custom: Font[] = [];

    fonts.forEach((font) => {
      if (font.isSystem) {
        system.push(font);
      } else {
        custom.push(font);
      }
    });

    return { systemFonts: system, customFonts: custom };
  }, [fonts]);

  const loadFont = useCallback(
    async (family: string, url?: string): Promise<void> => {
      try {
        await fontManager.loadFont(family, url);
        logger.info('useFonts: font loaded', { family, url });
      } catch (error) {
        logger.error('useFonts: loadFont failed', { error, family, url });
        throw error;
      }
    },
    [fontManager]
  );

  const getLoadedFonts = useCallback((): string[] => {
    return fontManager.getLoadedFonts();
  }, [fontManager]);

  return {
    fonts,
    systemFonts,
    customFonts,
    isLoading,
    error: error as Error | null,
    loadFont,
    getLoadedFonts,
    refetch: () => {
      refetch();
    },
  };
}
