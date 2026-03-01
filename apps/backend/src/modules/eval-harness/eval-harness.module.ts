import { Module } from '@nestjs/common';
import { LlmModule } from '@/libs/llm/llm.module';
import { EvalHarnessService } from './eval-harness.service';
import { EvalHarnessController } from './eval-harness.controller';

@Module({
  imports: [LlmModule],
  providers: [EvalHarnessService],
  controllers: [EvalHarnessController],
  exports: [EvalHarnessService],
})
export class EvalHarnessModule {}

