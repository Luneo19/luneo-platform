import { Module } from '@nestjs/common';
import { LlmModule as LlmLibModule } from '@/libs/llm/llm.module';
import { LlmController } from './llm.controller';

@Module({
  imports: [LlmLibModule],
  controllers: [LlmController],
  exports: [LlmLibModule],
})
export class LlmWrapperModule {}
