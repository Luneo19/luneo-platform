/**
 * useText
 * Text creation and editing hook
 * Integrates with FontManager for font loading
 */

'use client';

import { useCallback } from 'react';
import { FontManager, ContentValidator } from '@/lib/customizer';
import { logger } from '@/lib/logger';

interface TextOptions {
  x?: number;
  y?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through';
  opacity?: number;
  rotation?: number;
  zoneId?: string;
}

interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through';
  opacity?: number;
}

interface UseTextReturn {
  addText: (text: string, options?: TextOptions) => Promise<string>;
  updateText: (id: string, text: string, style?: TextStyle) => Promise<void>;
  applyTextStyle: (id: string, style: TextStyle) => Promise<void>;
  validateText: (text: string) => { valid: boolean; errors: string[] };
  loadFont: (family: string, url?: string) => Promise<void>;
}

/**
 * Text operations hook
 */
export function useText(onAddText?: (text: string, options: TextOptions) => Promise<string>): UseTextReturn {
  const fontManager = new FontManager();

  const addText = useCallback(
    async (text: string, options?: TextOptions): Promise<string> => {
      // Validate text
      const validation = validateText(text);
      if (!validation.valid) {
        throw new Error(`Text validation failed: ${validation.errors.join(', ')}`);
      }

      if (onAddText) {
        return onAddText(text, options || {});
      }

      // Fallback: generate ID and return it
      const id = crypto.randomUUID();
      logger.warn('useText: onAddText callback not provided, returning generated ID', { id, text });
      return id;
    },
    [onAddText]
  );

  const updateText = useCallback(
    async (id: string, text: string, style?: TextStyle): Promise<void> => {
      // Validate text
      const validation = validateText(text);
      if (!validation.valid) {
        throw new Error(`Text validation failed: ${validation.errors.join(', ')}`);
      }

      logger.info('useText: updateText called', { id, text, style });
      // Implementation would update the text object on canvas
    },
    []
  );

  const applyTextStyle = useCallback(async (id: string, style: TextStyle): Promise<void> => {
    logger.info('useText: applyTextStyle called', { id, style });
    // Implementation would apply style to text object
  }, []);

  const validateText = useCallback(
    (text: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!text || text.trim().length === 0) {
        errors.push('Text cannot be empty');
      }

      // Use ContentValidator if available
      try {
        const result = ContentValidator.checkTextContent(text);
        if (!result.valid) {
          errors.push(result.reason || 'Invalid text content');
        }
      } catch (err) {
        logger.warn('useText: ContentValidator not available', { error: err });
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    []
  );

  const loadFont = useCallback(
    async (family: string, url?: string): Promise<void> => {
      try {
        await fontManager.loadFont(family, url);
      } catch (err) {
        logger.error('useText: loadFont failed', { error: err, family, url });
        throw err;
      }
    },
    [fontManager]
  );

  return {
    addText,
    updateText,
    applyTextStyle,
    validateText,
    loadFont,
  };
}
