import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GroqProvider } from './providers/groq.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { LLMCacheService } from './services/llm-cache.service';
import { TiktokenService } from './tokenizers/tiktoken.service';

const providers = [
  OpenAIProvider,
  AnthropicProvider,
  MistralProvider,
  GroqProvider,
  OllamaProvider,
  LLMCacheService,
  TiktokenService,
];

@Module({
  imports: [
    HttpModule.register({ timeout: 60000 }),
    ConfigModule,
    SmartCacheModule,
  ],
  providers,
  exports: providers,
})
export class LLMModule {}
