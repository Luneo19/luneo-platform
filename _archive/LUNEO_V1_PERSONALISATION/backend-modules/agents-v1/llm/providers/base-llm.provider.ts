import { Observable } from 'rxjs';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  tools?: LLMToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  responseFormat?: { type: 'text' | 'json_object' };
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMCompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: LLMToolCall[];
  model: string;
}

export interface LLMStreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: Partial<LLMToolCall>;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export interface LLMHealthStatus {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export abstract class BaseLLMProvider {
  abstract readonly name: string;
  abstract readonly isAvailable: boolean;

  abstract complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;

  abstract stream(request: LLMCompletionRequest): Observable<LLMStreamChunk>;

  abstract countTokens(text: string, model: string): Promise<number>;

  abstract healthCheck(): Promise<LLMHealthStatus>;

  getModelCost(_model: string): { inputPer1kTokens: number; outputPer1kTokens: number } {
    return { inputPer1kTokens: 0, outputPer1kTokens: 0 };
  }
}
