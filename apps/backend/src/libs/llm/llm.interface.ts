import { Observable } from 'rxjs';

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
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
  /**
   * Hard timeout for provider execution.
   */
  timeoutMs?: number;
  /**
   * Retry count before fallback providers.
   */
  retryCount?: number;
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

  'gemini-2.0-flash': [0.1, 0.4],
  'gemini-2.0-flash-lite': [0.075, 0.3],
  'gemini-1.5-pro': [1.25, 5],
  'gemini-1.5-flash': [0.075, 0.3],

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

export interface LlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  maxTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  capabilities: ('chat' | 'embedding' | 'vision' | 'function_calling')[];
}

export const MODEL_CATALOG: LlmModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: LlmProvider.OPENAI, maxTokens: 128000, inputCostPer1M: 2.5, outputCostPer1M: 10, capabilities: ['chat', 'vision', 'function_calling'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: LlmProvider.OPENAI, maxTokens: 128000, inputCostPer1M: 0.15, outputCostPer1M: 0.6, capabilities: ['chat', 'vision', 'function_calling'] },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: LlmProvider.OPENAI, maxTokens: 128000, inputCostPer1M: 10, outputCostPer1M: 30, capabilities: ['chat', 'vision', 'function_calling'] },

  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: LlmProvider.ANTHROPIC, maxTokens: 200000, inputCostPer1M: 3, outputCostPer1M: 15, capabilities: ['chat', 'vision', 'function_calling'] },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: LlmProvider.ANTHROPIC, maxTokens: 200000, inputCostPer1M: 1, outputCostPer1M: 5, capabilities: ['chat', 'function_calling'] },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: LlmProvider.ANTHROPIC, maxTokens: 200000, inputCostPer1M: 15, outputCostPer1M: 75, capabilities: ['chat', 'vision', 'function_calling'] },

  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: LlmProvider.GOOGLE, maxTokens: 1048576, inputCostPer1M: 0.1, outputCostPer1M: 0.4, capabilities: ['chat', 'vision', 'function_calling'] },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: LlmProvider.GOOGLE, maxTokens: 1048576, inputCostPer1M: 0.075, outputCostPer1M: 0.3, capabilities: ['chat'] },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: LlmProvider.GOOGLE, maxTokens: 2097152, inputCostPer1M: 1.25, outputCostPer1M: 5, capabilities: ['chat', 'vision', 'function_calling'] },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: LlmProvider.GOOGLE, maxTokens: 1048576, inputCostPer1M: 0.075, outputCostPer1M: 0.3, capabilities: ['chat', 'vision'] },

  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: LlmProvider.GROQ, maxTokens: 32768, inputCostPer1M: 0.59, outputCostPer1M: 0.79, capabilities: ['chat', 'function_calling'] },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: LlmProvider.GROQ, maxTokens: 8192, inputCostPer1M: 0.05, outputCostPer1M: 0.08, capabilities: ['chat'] },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: LlmProvider.GROQ, maxTokens: 32768, inputCostPer1M: 0.24, outputCostPer1M: 0.24, capabilities: ['chat'] },

  { id: 'mistral-large-latest', name: 'Mistral Large', provider: LlmProvider.MISTRAL, maxTokens: 128000, inputCostPer1M: 2, outputCostPer1M: 6, capabilities: ['chat', 'function_calling'] },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: LlmProvider.MISTRAL, maxTokens: 128000, inputCostPer1M: 0.2, outputCostPer1M: 0.6, capabilities: ['chat', 'function_calling'] },
  { id: 'open-mistral-nemo', name: 'Mistral Nemo', provider: LlmProvider.MISTRAL, maxTokens: 128000, inputCostPer1M: 0.15, outputCostPer1M: 0.15, capabilities: ['chat'] },
];
