import { Observable } from 'rxjs';

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
  MISTRAL = 'mistral',
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  /**
   * Force routing to a specific provider instead of auto-detecting from model name.
   */
  provider?: LlmProvider;
  /**
   * Ordered list of fallback providers to try if the primary fails.
   */
  fallbackProviders?: LlmProvider[];
  /**
   * Abort signal for cancellation support.
   */
  signal?: AbortSignal;
}

export interface LlmCompletionResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: LlmProvider;
  latencyMs: number;
  costUsd: number;
}

export interface LlmStreamEvent {
  type: 'delta' | 'done' | 'error';
  content?: string;
  model?: string;
  provider?: LlmProvider;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  costUsd?: number;
  error?: string;
}

export interface LlmProviderInterface {
  readonly provider: LlmProvider;

  complete(options: LlmCompletionOptions): Promise<LlmCompletionResult>;

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent>;

  isAvailable(): boolean;
}

/**
 * Cost per 1M tokens in USD: [input, output]
 */
export const MODEL_PRICING: Record<string, [number, number]> = {
  'gpt-4o': [2.5, 10],
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4-turbo': [10, 30],
  'gpt-4': [30, 60],
  'gpt-3.5-turbo': [0.5, 1.5],

  'claude-3-5-sonnet-20241022': [3, 15],
  'claude-3-5-haiku-20241022': [1, 5],
  'claude-3-opus-20240229': [15, 75],
  'claude-3-sonnet-20240229': [3, 15],
  'claude-3-haiku-20240307': [0.25, 1.25],

  'llama-3.3-70b-versatile': [0.59, 0.79],
  'llama-3.1-8b-instant': [0.05, 0.08],
  'mixtral-8x7b-32768': [0.24, 0.24],

  'mistral-large-latest': [2, 6],
  'mistral-medium-latest': [2.7, 8.1],
  'mistral-small-latest': [0.2, 0.6],
  'open-mistral-nemo': [0.15, 0.15],
  'open-mistral-7b': [0.25, 0.25],
};

export function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const pricing = findPricing(model);
  if (!pricing) return 0;

  const [inputPer1M, outputPer1M] = pricing;
  return (tokensIn / 1_000_000) * inputPer1M + (tokensOut / 1_000_000) * outputPer1M;
}

function findPricing(model: string): [number, number] | undefined {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  const key = Object.keys(MODEL_PRICING).find((k) => model.startsWith(k));
  return key ? MODEL_PRICING[key] : undefined;
}
