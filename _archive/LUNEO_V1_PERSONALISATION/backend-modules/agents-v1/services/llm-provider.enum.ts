/**
 * @fileoverview Enum pour les providers LLM
 * @module LLMProvider
 *
 * Fichier séparé pour éviter les problèmes d'import circulaire
 */

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MISTRAL = 'mistral',
  GROQ = 'groq',
  OLLAMA = 'ollama',
}

export const LLM_MODELS = {
  [LLMProvider.OPENAI]: {
    GPT4O: 'gpt-4o',
    GPT4O_MINI: 'gpt-4o-mini',
    GPT4_TURBO: 'gpt-4-turbo-preview',
    GPT4: 'gpt-4',
    GPT35_TURBO: 'gpt-3.5-turbo',
  },
  [LLMProvider.ANTHROPIC]: {
    CLAUDE_35_SONNET: 'claude-3-5-sonnet-20241022',
    CLAUDE_3_OPUS: 'claude-3-opus-20240229',
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  },
  [LLMProvider.MISTRAL]: {
    MISTRAL_LARGE: 'mistral-large-latest',
    MISTRAL_MEDIUM: 'mistral-medium-latest',
    MISTRAL_SMALL: 'mistral-small-latest',
  },
  [LLMProvider.GROQ]: {
    LLAMA_3_70B: 'llama-3.1-70b-versatile',
    LLAMA_3_8B: 'llama-3.1-8b-instant',
    MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  },
  [LLMProvider.OLLAMA]: {
    LLAMA3: 'llama3',
    MISTRAL: 'mistral',
    CODELLAMA: 'codellama',
  },
} as const;

export const LLM_COSTS_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'mistral-large-latest': { input: 0.002, output: 0.006 },
  'mistral-medium-latest': { input: 0.0027, output: 0.0081 },
  'mistral-small-latest': { input: 0.0002, output: 0.0006 },
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
  'llama3': { input: 0, output: 0 },
  'mistral': { input: 0, output: 0 },
  'codellama': { input: 0, output: 0 },
};

export const AGENT_LLM_CONFIGS = {
  luna: {
    primary: { provider: LLMProvider.OPENAI, model: LLM_MODELS[LLMProvider.OPENAI].GPT4O },
    fallback: { provider: LLMProvider.ANTHROPIC, model: LLM_MODELS[LLMProvider.ANTHROPIC].CLAUDE_35_SONNET },
  },
  aria: {
    primary: { provider: LLMProvider.OPENAI, model: LLM_MODELS[LLMProvider.OPENAI].GPT4O },
    fallback: { provider: LLMProvider.ANTHROPIC, model: LLM_MODELS[LLMProvider.ANTHROPIC].CLAUDE_35_SONNET },
  },
  nova: {
    primary: { provider: LLMProvider.OPENAI, model: LLM_MODELS[LLMProvider.OPENAI].GPT4O_MINI },
    fallback: { provider: LLMProvider.GROQ, model: LLM_MODELS[LLMProvider.GROQ].LLAMA_3_70B },
  },
} as const;
