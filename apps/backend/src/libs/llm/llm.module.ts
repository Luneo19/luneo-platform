import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    OpenAiProvider,
    AnthropicProvider,
    GoogleProvider,
    GroqProvider,
    MistralProvider,
    LlmService,
  ],
  exports: [LlmService],
})
export class LlmModule {}
