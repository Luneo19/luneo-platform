/**
 * @fileoverview Service de streaming pour les réponses LLM
 * @module LLMStreamService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Streaming avec Server-Sent Events
 * - ✅ Support multi-provider
 * - ✅ Types explicites
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LLMProvider, LLM_MODELS, Message } from './llm-router.service';
import { PromptSecurityService } from './prompt-security.service';
import { OutputSanitizerService } from '../security/output-sanitizer.service';
import { firstValueFrom } from 'rxjs';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LLMStreamService {
  private readonly logger = new Logger(LLMStreamService.name);

  // API Keys
  private readonly openaiApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly mistralApiKey: string;

  // Endpoints
  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
  private readonly MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly security: PromptSecurityService,
    private readonly outputSanitizer: OutputSanitizerService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    this.mistralApiKey = this.configService.get<string>('MISTRAL_API_KEY') || '';
  }

  /**
   * Stream une réponse LLM
   */
  stream(
    provider: LLMProvider,
    model: string,
    messages: Message[],
    options: {
      temperature?: number;
      maxTokens?: number;
      brandId?: string;
      agentType?: string;
    } = {},
  ): Observable<StreamChunk> {
    // Securiser les inputs avant streaming
    const sanitizedMessages = messages.map((msg) => {
      if (msg.role === 'user') {
        const check = this.security.checkInput(msg.content);
        if (!check.safe) {
          this.logger.warn(`Security threat in stream input: ${check.threats.join(', ')}`);
          return { ...msg, content: this.security.sanitizeInput(msg.content) };
        }
      }
      return msg;
    });

    return new Observable((observer) => {
      let fullContent = '';

      const wrappedObserver = {
        next: (chunk: StreamChunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
          }
          observer.next(chunk);
        },
        error: (error: Error) => observer.error(error),
        complete: () => {
          // Sanitiser le contenu complet a la fin du stream
          if (fullContent.length > 0) {
            const sanitized = this.outputSanitizer.sanitize(fullContent);
            if (sanitized.wasModified) {
              this.logger.warn(`Stream output sanitized, removed: ${sanitized.removedPatterns.join(', ')}`);
            }
          }
          observer.complete();
        },
      };

      this.streamLLM(provider, model, sanitizedMessages, options, wrappedObserver)
        .catch((error) => {
          this.logger.error(`Stream error: ${error.message}`);
          observer.error(error);
        });
    });
  }

  /**
   * Stream selon le provider
   */
  private async streamLLM(
    provider: LLMProvider,
    model: string,
    messages: Message[],
    options: {
      temperature?: number;
      maxTokens?: number;
      brandId?: string;
      agentType?: string;
    },
    observer: {
      next: (chunk: StreamChunk) => void;
      error: (error: Error) => void;
      complete: () => void;
    },
  ): Promise<void> {
    switch (provider) {
      case LLMProvider.OPENAI:
        await this.streamOpenAI(model, messages, options, observer);
        break;
      case LLMProvider.ANTHROPIC:
        await this.streamAnthropic(model, messages, options, observer);
        break;
      case LLMProvider.MISTRAL:
        await this.streamMistral(model, messages, options, observer);
        break;
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Stream OpenAI (SSE)
   */
  private async streamOpenAI(
    model: string,
    messages: Message[],
    options: {
      temperature?: number;
      maxTokens?: number;
    },
    observer: {
      next: (chunk: StreamChunk) => void;
      error: (error: Error) => void;
      complete: () => void;
    },
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.OPENAI_URL,
          {
            model,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: true,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
          },
        ),
      );

      let buffer = '';
      let totalTokens = 0;

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              observer.complete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;

              if (delta?.content) {
                observer.next({
                  content: delta.content,
                  done: false,
                });
              }

              if (parsed.usage) {
                totalTokens = parsed.usage.total_tokens;
              }
            } catch (error) {
              // Ignorer erreurs de parsing
            }
          }
        }
      });

      response.data.on('end', () => {
        observer.next({
          content: '',
          done: true,
          usage: {
            promptTokens: 0, // OpenAI ne fournit pas dans stream
            completionTokens: 0,
            totalTokens,
          },
        });
        observer.complete();
      });

      response.data.on('error', (error: Error) => {
        observer.error(error);
      });
    } catch (error) {
      observer.error(error instanceof Error ? error : new InternalServerErrorException(String(error)));
    }
  }

  /**
   * Stream Anthropic (SSE)
   */
  private async streamAnthropic(
    model: string,
    messages: Message[],
    options: {
      temperature?: number;
      maxTokens?: number;
    },
    observer: {
      next: (chunk: StreamChunk) => void;
      error: (error: Error) => void;
      complete: () => void;
    },
  ): Promise<void> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system');
      const otherMessages = messages.filter((m) => m.role !== 'system');

      const response = await firstValueFrom(
        this.httpService.post(
          this.ANTHROPIC_URL,
          {
            model,
            max_tokens: options.maxTokens || 4096,
            system: systemMessage?.content,
            messages: otherMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          },
          {
            headers: {
              'x-api-key': this.anthropicApiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
          },
        ),
      );

      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              observer.complete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta;

              if (delta?.text) {
                observer.next({
                  content: delta.text,
                  done: false,
                });
              }

              if (parsed.type === 'message_stop') {
                observer.next({
                  content: '',
                  done: true,
                  usage: parsed.usage
                    ? {
                        promptTokens: parsed.usage.input_tokens,
                        completionTokens: parsed.usage.output_tokens,
                        totalTokens:
                          parsed.usage.input_tokens + parsed.usage.output_tokens,
                      }
                    : undefined,
                });
                observer.complete();
              }
            } catch (error) {
              // Ignorer erreurs de parsing
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        observer.error(error);
      });
    } catch (error) {
      observer.error(error instanceof Error ? error : new InternalServerErrorException(String(error)));
    }
  }

  /**
   * Stream Mistral (SSE)
   */
  private async streamMistral(
    model: string,
    messages: Message[],
    options: {
      temperature?: number;
      maxTokens?: number;
    },
    observer: {
      next: (chunk: StreamChunk) => void;
      error: (error: Error) => void;
      complete: () => void;
    },
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.MISTRAL_URL,
          {
            model,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: true,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.mistralApiKey}`,
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
          },
        ),
      );

      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              observer.complete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;

              if (delta?.content) {
                observer.next({
                  content: delta.content,
                  done: false,
                });
              }

              if (parsed.usage) {
                observer.next({
                  content: '',
                  done: true,
                  usage: {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  },
                });
                observer.complete();
              }
            } catch (error) {
              // Ignorer erreurs de parsing
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        observer.error(error);
      });
    } catch (error) {
      observer.error(error instanceof Error ? error : new InternalServerErrorException(String(error)));
    }
  }
}
