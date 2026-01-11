/**
 * @fileoverview Enum pour les providers LLM
 * @module LLMProvider
 * 
 * Fichier séparé pour éviter les problèmes d'import circulaire
 */

/**
 * Providers LLM supportés
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MISTRAL = 'mistral',
}

/**
 * Modèles disponibles par provider
 */
export const LLM_MODELS = {
  [LLMProvider.OPENAI]: {
    GPT4_TURBO: 'gpt-4-turbo-preview',
    GPT4: 'gpt-4',
    GPT35_TURBO: 'gpt-3.5-turbo',
  },
  [LLMProvider.ANTHROPIC]: {
    CLAUDE_3_OPUS: 'claude-3-opus-20240229',
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  },
  [LLMProvider.MISTRAL]: {
    MISTRAL_LARGE: 'mistral-large-latest',
    MISTRAL_MEDIUM: 'mistral-medium-latest',
    MISTRAL_SMALL: 'mistral-small-latest',
  },
} as const;
